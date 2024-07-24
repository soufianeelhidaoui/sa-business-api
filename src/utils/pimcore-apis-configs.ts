import config from '@config';
import { Brand } from '@ts-types/brand.t';

export type PimcoreAPIConfig = {
  apiURL: string;
  gqlEndpoint: string;
  apiKey: string;
};

export const getPimcoreAPI = (brand: Brand): PimcoreAPIConfig => {
  const brandUpperCased = brand.toUpperCase();
  
  const pimcoreAPIURL = config.get(`VITE_${brandUpperCased}_PIMCORE_API_URL`);
  const pimcoreGqlEndpoint = config.get(`VITE_${brandUpperCased}_PIMCORE_API_GQLENPOINT`);
  const pimcoreApiKey = config.get(`VITE_${brandUpperCased}_PIMCORE_API_APIKEY`);

  return {
    apiURL: pimcoreAPIURL,
    gqlEndpoint: pimcoreGqlEndpoint,
    apiKey: pimcoreApiKey,
  };
};
