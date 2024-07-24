import xlsx from 'node-xlsx';

import getPimcoreProducts from '@clients/pimcore/methods/get-pimcore-products';
import logger from '@utils/logger';
import { getSyliusPrices } from '@clients/sylius/sylius';
import { Context } from 'koa';

const headers = [
  'Référence',
  'Nom du produit',
  'Statut de publication',
  'Prix conseillé TTC',
  'Prix pratiqué TTC',
];

const getPrices = async (ctx: Context) => {
  const { brand, kvps } = ctx.state;

  const products = await getPimcoreProducts(brand);

  const syliusPrices = await getSyliusPrices(brand, kvps);

    const updatedPrices = products.map(({ node: product }) => {
      const { reference, name, published, recommendedPromotionPriceTTC, recommendedPriceTTC } = product;

      const updatedItem = [
        reference,
        name,
        published ? 'Publié' : 'Dépublié',
        recommendedPromotionPriceTTC || recommendedPriceTTC,
        syliusPrices?.data?.[reference]?.vendorPriceTTC,
      ];

      if (syliusPrices?.data?.[reference]) delete syliusPrices?.data[reference];

      return updatedItem;
    });

    Object.keys(syliusPrices || {}).forEach((key) => logger.warn(`Could not match the sylius' product reference ${key} in pimcore`));

    const buffer = xlsx.build([{ name: 'Fichier Prix', data: [headers, ...updatedPrices] }]);

    return Promise.resolve(buffer);
};

export default getPrices;



