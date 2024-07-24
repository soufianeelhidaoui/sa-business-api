import axios, { AxiosInstance } from 'axios';
import { Agent } from 'https';

import { Brand } from '@ts-types/brand.t';
import { BrandDealerApiConfig } from '@ts-types/dealers.config.t';
import { BrandDealerTypeMap } from '@ts-types/dealers.t';
import { getBrandDealerApiConfig } from '@utils/brands-apis-configs';

export type DealerApiMethods<T> = {
  get: () => Promise<T[]>;
};

export type GetDealerApiMethodsFN = <T extends Brand>(
  brand: Brand,
) => DealerApiMethods<BrandDealerTypeMap[T]>;

/*
  creates an axios instance based on brand thanks to whom
    the required config will be extracted from dealers.config.json.

  Returns an object with a "get" method to get the dealers.
*/

const getDealerApiMethods: GetDealerApiMethodsFN = <T extends Brand>(brand: Brand) => {
  type BrandType = BrandDealerTypeMap[T];

  const config: BrandDealerApiConfig | null = getBrandDealerApiConfig(brand);

  const instance: AxiosInstance = axios.create({
    baseURL: config?.apiUrl,
    headers: {
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*',
      Authorization: `Basic ${config?.token}`,
      'Content-Type': 'application/json',
    },
    httpsAgent: new Agent({
      rejectUnauthorized: false,
    }),
    method: 'get',
  });

  const dealersApiMethods: DealerApiMethods<BrandType> = {
    get: () =>
      instance<BrandType[]>({})
        .then(({ data }) => data as BrandType[]),
  };

  return dealersApiMethods;
};

export default getDealerApiMethods;
