provider "aws" {
  default_tags {
    tags = {
      project     = "VGF"
      environment = "preproduction"
      reason      = "application"
    }
  }
}
