export interface BrandDealerApiConfig {
  apiUrl: string;
  token: string;
}

export interface BrandsDealersApisConfigs {
  [key: string]: BrandDealerApiConfig;
}
