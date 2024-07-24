locals {

  name_prefix = "vgf-development"

  environment = [
    { name = "VITE_PORT", value = "80" },
    { name = "VITE_CACHE_HOURS_CHECK_INTERVAL", value = "number" },
  ]

  account_id       = "960144829873"
  region           = "eu-west-3"
  application_name = "sa-business-api"
  image_name       = "vgf-development-ecr-repository:${var.CONTAINER_IMAGE_TAG}"
}
