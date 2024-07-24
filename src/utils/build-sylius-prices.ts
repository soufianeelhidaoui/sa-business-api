import { XLS_STATUSES } from '@constants/file-handling-messages';

const PIM_IDENTICAL_PRICE = -1;
const REF_NOT_FOUND = -2;

const buildPrice = (
  products,
  {
    reference, vendorPriceTTC: vendorPriceTTCRaw, advisedPriceTTC: advisedPriceTTCRaw, syliusPrice,
  },
) => {
  // round to two decimals
  const round = (val) => Math.round(val * 100) / 100;
  const vendorPriceTTC = vendorPriceTTCRaw ? round(vendorPriceTTCRaw) : 0;
  const advisedPriceTTC = advisedPriceTTCRaw ? round(advisedPriceTTCRaw) : 0;

  // get the updated price from pimcore
  const {
    recommendedPromotionPriceTTC,
    recommendedPriceTTC,
  } = products[reference] || {};

  const pimPrice = round(recommendedPromotionPriceTTC || recommendedPriceTTC);

  if (!pimPrice) return REF_NOT_FOUND;

  if (vendorPriceTTC && vendorPriceTTC !== pimPrice) return vendorPriceTTC;
  if (vendorPriceTTC && vendorPriceTTC === pimPrice) return PIM_IDENTICAL_PRICE;

  if (syliusPrice && syliusPrice !== pimPrice) return syliusPrice;
  if (syliusPrice && syliusPrice === pimPrice) return PIM_IDENTICAL_PRICE;

  if (advisedPriceTTC && advisedPriceTTC !== pimPrice) {
    throw new Error(XLS_STATUSES.PIMCORE_PRICE_MISSMATCH);
  }
  if (advisedPriceTTC && advisedPriceTTC === pimPrice) return PIM_IDENTICAL_PRICE;

  return REF_NOT_FOUND;
};

export const buildSyliusPrices = (xlsxFile, products, syliusPrices = {}) => {
  const { data, headers } = xlsxFile;
  const ignored = [];
  const notFound = [];
  const updated = [];
  const alreadyInSylius = [];

  let error;

  const prices = data.reduce((accPrices, d) => {
    if (error) return {};

    if (!d?.length) {
      return accPrices;
    }

    const headermap = {
      Référence: 'reference',
      'Prix pratiqué TTC': 'vendorPriceTTC',
      'Prix conseillé TTC': 'advisedPriceTTC',
    };

    // loop through the headers to get an object from the array of data
    const dataObject = headers.reduce((acc, header, index) => ({
      ...acc,
      [headermap[header] || 'unknown']: d[index]?.toString?.()?.trim?.() || '',
    }), {});

    const { reference } = dataObject;
    const vendorPriceTTC = Number(dataObject?.vendorPriceTTC || '');
    const advisedPriceTTC = Number(dataObject?.advisedPriceTTC || '');

    const isInvalidPrice = (p) => Number.isNaN(p) || p < 0;

    if (!reference || isInvalidPrice(vendorPriceTTC) || isInvalidPrice(advisedPriceTTC)) {
      throw new Error('invalid Data format')
    }

    let price;
    const syliusPrice = syliusPrices[reference]?.vendorPriceTTC || 0;

      price = buildPrice(products, {
        reference,
        vendorPriceTTC,
        advisedPriceTTC,
        syliusPrice,
      });

      if (price === REF_NOT_FOUND) notFound.push(reference);
      if (price === PIM_IDENTICAL_PRICE) ignored.push(reference);

      if (price < 0) return accPrices;

      if (price !== syliusPrice) updated.push(reference);
      else alreadyInSylius.push(reference);

    return (
      { ...accPrices, [reference]: { vendorPriceTTC: price } }
    );
  }, {});

  const validPricesRefs = [...updated, ...alreadyInSylius];
  const deleted = Object.keys(syliusPrices).filter((key) => !validPricesRefs.includes(key));

  return {
    prices,
    updated,
    deleted,
    ignored,
    notFound,
  };
};
