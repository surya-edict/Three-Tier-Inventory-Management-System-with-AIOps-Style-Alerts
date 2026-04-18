module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${var.project_name}-eks"
  cluster_version = "1.29"

  # Security: Restrict public endpoint blast radius
  cluster_endpoint_public_access       = true
  cluster_endpoint_public_access_cidrs = [var.corporate_ip_cidr] 
  cluster_endpoint_private_access      = true

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  # Security: Encrypt Kubernetes Secrets at rest using AWS KMS
  create_kms_key = true
  cluster_encryption_config = {
    resources = ["secrets"]
  }

  eks_managed_node_groups = {
    # FinOps: Baseline capacity using Graviton (ARM64) for stateful/system pods
    baseline_graviton = {
      instance_types = ["t4g.small"]
      ami_type       = "AL2_ARM_64"
      min_size       = 1
      max_size       = 1
      desired_size   = 1
      capacity_type  = "ON_DEMAND"
    }
    # FinOps: Scalable compute using Spot Fleet for stateless application pods
    stateless_spot = {
      instance_types = ["t4g.small", "t4g.medium"]
      ami_type       = "AL2_ARM_64"
      min_size       = 0
      max_size       = 3
      desired_size   = 1
      capacity_type  = "SPOT"
      labels = {
        lifecycle = "spot"
      }
      taints = [{
        key    = "spotInstance"
        value  = "true"
        effect = "PREFER_NO_SCHEDULE"
      }]
    }
  }

  enable_cluster_creator_admin_permissions = true
}
