variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "inventory-system"
}

variable "db_password" {
  description = "RDS root password. Note: Inject via AWS Secrets Manager in pipeline."
  type        = string
  sensitive   = true
}

variable "corporate_ip_cidr" {
  description = "Corporate VPN CIDR for bounded API server access"
  type        = string
  default     = "10.255.0.0/16" 
}

variable "finops_tags" {
  description = "Mandatory FinOps tagging schema for cost attribution"
  type        = map(string)
  default = {
    Environment = "production"
    CostCenter  = "infra-01"
    Owner       = "platform-team"
    Project     = "inventory-system"
  }
}
