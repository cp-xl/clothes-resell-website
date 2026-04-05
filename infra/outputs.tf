output "api_url" {
  description = "API Gateway base URL"
  value       = "${aws_apigatewayv2_api.api.api_endpoint}/prod"
}

output "images_bucket" {
  description = "S3 bucket for uploaded images (private — served via CloudFront)"
  value       = aws_s3_bucket.images.id
}

output "cloudfront_domain" {
  description = "CloudFront domain for serving images"
  value       = aws_cloudfront_distribution.images.domain_name
}

output "dynamodb_table" {
  description = "DynamoDB table for listings"
  value       = aws_dynamodb_table.listings.name
}
