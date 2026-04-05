# =============================================================================
# DynamoDB — point-in-time recovery enabled
# =============================================================================

resource "aws_dynamodb_table" "listings" {
  name         = "${var.project_name}-listings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}

# =============================================================================
# S3 — private bucket, served only via CloudFront OAC
# =============================================================================

resource "aws_s3_bucket" "images" {
  bucket = "${var.project_name}-images-${data.aws_caller_identity.current.account_id}"
}

# Block ALL public access — images are served through CloudFront only
resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "images" {
  bucket = aws_s3_bucket.images.id

  versioning_configuration {
    status = "Enabled"
  }
}

# CORS for direct pre-signed PUT uploads from the browser
resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["Content-Type"]
    allowed_methods = ["PUT"]
    allowed_origins = var.allowed_origins
    max_age_seconds = 3600
  }
}

# Only CloudFront can read from this bucket
resource "aws_s3_bucket_policy" "images_cloudfront" {
  bucket = aws_s3_bucket.images.id

  depends_on = [aws_s3_bucket_public_access_block.images]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAC"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.images.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.images.arn
          }
        }
      }
    ]
  })
}

# =============================================================================
# CloudFront — serves images from S3 via OAC
# =============================================================================

resource "aws_cloudfront_origin_access_control" "images" {
  name                              = "${var.project_name}-images-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "images" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.project_name} image CDN"

  origin {
    domain_name              = aws_s3_bucket.images.bucket_regional_domain_name
    origin_id                = "s3-images"
    origin_access_control_id = aws_cloudfront_origin_access_control.images.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-images"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# =============================================================================
# IAM — separate roles per Lambda (least privilege)
# =============================================================================

# --- Listings Lambda Role: DynamoDB only ---

resource "aws_iam_role" "listings_lambda" {
  name = "${var.project_name}-listings-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "listings_lambda_basic" {
  role       = aws_iam_role.listings_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "listings_dynamodb" {
  name = "${var.project_name}-listings-dynamodb"
  role = aws_iam_role.listings_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.listings.arn
      }
    ]
  })
}

# --- Upload Lambda Role: S3 PutObject only ---

resource "aws_iam_role" "upload_lambda" {
  name = "${var.project_name}-upload-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "upload_lambda_basic" {
  role       = aws_iam_role.upload_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "upload_s3" {
  name = "${var.project_name}-upload-s3"
  role = aws_iam_role.upload_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.images.arn}/uploads/*"
      }
    ]
  })
}

# =============================================================================
# Lambda Functions
# =============================================================================

data "archive_file" "listings_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/functions/listings"
  output_path = "${path.module}/.build/listings.zip"
}

resource "aws_lambda_function" "listings" {
  function_name    = "${var.project_name}-listings"
  filename         = data.archive_file.listings_zip.output_path
  source_code_hash = data.archive_file.listings_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 15
  memory_size      = 256
  role             = aws_iam_role.listings_lambda.arn

  environment {
    variables = {
      TABLE_NAME       = aws_dynamodb_table.listings.name
      CLOUDFRONT_DOMAIN = aws_cloudfront_distribution.images.domain_name
    }
  }
}

data "archive_file" "upload_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/functions/upload"
  output_path = "${path.module}/.build/upload.zip"
}

resource "aws_lambda_function" "upload" {
  function_name    = "${var.project_name}-upload"
  filename         = data.archive_file.upload_zip.output_path
  source_code_hash = data.archive_file.upload_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 15
  memory_size      = 256
  role             = aws_iam_role.upload_lambda.arn

  environment {
    variables = {
      BUCKET_NAME      = aws_s3_bucket.images.id
      CLOUDFRONT_DOMAIN = aws_cloudfront_distribution.images.domain_name
    }
  }
}

# =============================================================================
# API Gateway — with throttling and access logging
# =============================================================================

resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 3600
  }
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.project_name}-api"
  retention_in_days = 30
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "prod"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      method         = "$context.httpMethod"
      path           = "$context.path"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      latency        = "$context.integrationLatency"
      time           = "$context.requestTime"
    })
  }

  default_route_settings {
    throttling_burst_limit = 50
    throttling_rate_limit  = 20
  }
}

# --- Listings routes ---

resource "aws_apigatewayv2_integration" "listings" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.listings.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_listings" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /listings"
  target    = "integrations/${aws_apigatewayv2_integration.listings.id}"
}

resource "aws_apigatewayv2_route" "get_listing" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /listings/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.listings.id}"
}

resource "aws_apigatewayv2_route" "create_listing" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /listings"
  target    = "integrations/${aws_apigatewayv2_integration.listings.id}"
}

resource "aws_lambda_permission" "listings_apigw" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.listings.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# --- Upload routes ---

resource "aws_apigatewayv2_integration" "upload" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.upload.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upload_url" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /upload-url"
  target    = "integrations/${aws_apigatewayv2_integration.upload.id}"
}

resource "aws_lambda_permission" "upload_apigw" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
