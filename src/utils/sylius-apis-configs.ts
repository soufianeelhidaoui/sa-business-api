import { Brand } from '@ts-types/brand.t';
import config from '@config';

export type SyliusAPIConfig = {
  apiURL: string;
  username: string;
  password: string;
};

export const getSyliusAPI = (brand: Brand): SyliusAPIConfig => {
  const brandUpperCased = brand.toUpperCase();

  const syliusAPIURL = config.get(`VITE_${brandUpperCased}_SYLIUS_API_URL`);
  const syliusAPIUsername = config.get(`VITE_${brandUpperCased}_SYLIUS_API_USERNAME`);
  const syliusAPIPassword = config.get(`VITE_${brandUpperCased}_SYLIUS_API_PASSWORD`);

  return {
    apiURL: syliusAPIURL,
    password: syliusAPIPassword,
    username: syliusAPIUsername,
  };
};
