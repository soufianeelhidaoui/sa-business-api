import brands from '@constants/brands';
import { Brand } from '@ts-types/brand.t';
import { BrandDealerApiConfig, BrandsDealersApisConfigs } from '@ts-types/dealers.config.t';
import logger from '@utils/logger';
import config from '@config';

/* utils */

const buildWarningMessage = (
  dealerApiKey: string,
  tokenKey: string,
  apiUrl: string | undefined,
  token: string | undefined,
) => {
  const missingKeys = [apiUrl ? '' : dealerApiKey, token ? '' : tokenKey].filter((e) => e);

  const conjugated = missingKeys.length > 1 ? 'are' : 'is';

  /* The double space is not an typo */
  return `⚠️  ${missingKeys.join(' and ')} ${conjugated} missing from the environment variables`;
};

export const getBrandDealerApiConfig = (
  brand: Brand,
  disableWarning?: boolean,
): BrandDealerApiConfig | null => {
  const brandUpperCased = brand.toUpperCase();

  const dealerApiKey = `VITE_${brandUpperCased}_DEALER_API_URL`;
  const tokenKey = `VITE_${brandUpperCased}_DEALER_TOKEN`;

  const apiUrl = config.get(dealerApiKey);
  const token = config.get(tokenKey);

  /* valid */

  if (apiUrl && token) {
    return {
      apiUrl,
      token,
    };
  }

  /* invalid */

  if (!disableWarning) {
    logger.warn(buildWarningMessage(dealerApiKey, tokenKey, apiUrl, token));
  }

  return null;
};

const brandsDealersApisConfigs: BrandsDealersApisConfigs = brands.reduce(
  (acc: BrandsDealersApisConfigs, brand: Brand) => {
    const brandConfig = getBrandDealerApiConfig(brand, true);

    if (!brandConfig) return acc;

    return {
      ...acc,
      [brand]: brandConfig,
    };
  },
  {} as BrandsDealersApisConfigs,
);

export default brandsDealersApisConfigs;
