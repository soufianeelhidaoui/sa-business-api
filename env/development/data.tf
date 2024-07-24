data "terraform_remote_state" "remote_infra" {
  backend = "s3"
  config = {
    bucket = "vgf-iac-terraform-states"
    key    = "socle-infra/development/terraform.tfstate"
    region = "eu-west-3"
  }
}

data "terraform_remote_state" "remote_app" {
  backend = "s3"
  config = {
    bucket = "vgf-iac-terraform-states"
    key    = "socle-application/development/terraform.tfstate"
    region = "eu-west-3"
  }
}

