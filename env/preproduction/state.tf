terraform {
  backend "s3" {
    bucket         = "vgf-iac-terraform-states"
    key            = "application-deployment/preproduction/terraform.tfstate"
    encrypt        = true
    dynamodb_table = "vgf-iac-terraform-state-locking"
  }
}
