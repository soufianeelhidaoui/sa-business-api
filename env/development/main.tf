module "ecs" {
  source  = "gitlab.com/inventivit/application-deployment/local"
  version = "1.2.0"

  name_prefix        = local.name_prefix
  environment        = local.environment
  application_name   = local.application_name
  image_name         = local.image_name
  account_id         = local.account_id
  region             = local.region
  vpc_id             = data.terraform_remote_state.remote_infra.outputs.vpc_id
  private_subnet_ids = data.terraform_remote_state.remote_infra.outputs.private_subnet_ids
  security_group_id  = data.terraform_remote_state.remote_app.outputs.security_group_ids["vgf-development-sa-business-api"]
  cluster            = data.terraform_remote_state.remote_infra.outputs.ecs_id
}
