variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project prefix for resource naming"
  type        = string
  default     = "newhome"
}

variable "allowed_origins" {
  description = "Allowed CORS origins for API Gateway and S3 (your frontend domain)"
  type        = list(string)
  default     = ["http://localhost:5173"]
}
