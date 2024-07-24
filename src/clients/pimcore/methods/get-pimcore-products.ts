import GET_PRODUCT_LISTING from '../graphql/queries/get-products-listing.graphql';
import axios, { type AxiosInstance } from 'axios';
import { getPimcoreAPI } from '@utils/pimcore-apis-configs';
import { Brand } from '@ts-types/brand.t';



const getPimcoreProducts = async(brand: Brand): Promise<string> => {
    const apiConfig = getPimcoreAPI(brand);

    const { body } = GET_PRODUCT_LISTING?.loc?.source

    const { apiURL, gqlEndpoint, apiKey } = apiConfig;

    const query = body

    const instance: AxiosInstance =  axios.create({
        baseURL: `${apiURL}/${gqlEndpoint}`, 
        headers: {
          'Content-Type': 'application/json',
          'X-Api-key': apiKey
        }
      });
    
    const result = await instance.post('', {query})

    const { data } = result

    const { data: { getProductListing } } = data;

    const { totalCount, edges } = getProductListing;
  
    const products = edges.map(({ node: { parent, ...rest } }) => (
      parent && parent.reference ? null : { node: rest }
    )).filter((e) => e);

    return products;

};

export default getPimcoreProducts;

