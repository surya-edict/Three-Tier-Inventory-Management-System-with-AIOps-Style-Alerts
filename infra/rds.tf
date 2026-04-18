module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.project_name}-db"

  engine            = "postgres"
  engine_version    = "15.4"
  # FinOps: Graviton DB instances offer ~20% better price-performance
  instance_class    = "db.t4g.micro"
  
  # FinOps: Explicit gp3 avoids unpredictable gp2 burst credit depletion
  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "inventory"
  username = "postgres"
  password = var.db_password
  port     = "5432"

  # Security: Enforce short-lived credentials via IAM Auth
  iam_database_authentication_enabled = true

  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  family                 = "postgres15"
  major_engine_version   = "15"

  # Security: Mandatory guardrails for production state
  storage_encrypted   = true
  deletion_protection = true
  skip_final_snapshot = false
}

resource "aws_security_group" "db_sg" {
  name        = "${var.project_name}-db-sg"
  description = "Security group for RDS instance"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  # Security: Prevent data exfiltration. DBs do not initiate external connections.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
}
