import getPimcoreProducts from '@clients/pimcore/methods/get-pimcore-products';
import parseXls from '@utils/parse-xls';
import { getSyliusPrices } from '@clients/sylius/sylius';
import { buildSyliusPrices } from '@utils/build-sylius-prices';
import { Context } from 'koa';


const updatePrices = async (ctx: Context) => {
   /* get the products from pim */

   const products = await getPimcoreProducts(ctx.state.brand);

   const productsObject = products.reduce((acc, product) => {
     const { reference, ...p } = product?.node || {};

     return reference ? { ...acc, [reference]: p } : acc;
   }, {});

   const syliusPrices = await getSyliusPrices(ctx.state.brand, ctx.state.kvps);
   /* get the streamed XLS file */
   console.log("🚀 ~ updatePrices ~ ctx:", ctx.request.file)
   const xlsxFile = parseXls(ctx.request.file.path);
   const {
     notFound,
     deleted,
     prices: newSyliusPrices,
     updated,
   } = buildSyliusPrices(xlsxFile, productsObject, syliusPrices);

return {
    notFound,
    deleted,
    prices: newSyliusPrices,
    updated,
  }
};


export default updatePrices;