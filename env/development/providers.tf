provider "aws" {
  default_tags {
    tags = {
      project     = "VGF"
      environment = "development"
      reason      = "application"
    }
  }
}
