import { Dealer, DealerSkoda } from '@ts-types/dealers.t';
/*
  quick and dirty copy pasta. Waiting
    for the confirmation that these parsing rules still apply
*/

export type ParseSkodaFn = (dealers: DealerSkoda[]) => Dealer[];

const parseSkoda: ParseSkodaFn = (dealers) => {
  const activatedSkraDealers = dealers.reduce((acc, dealer) => {
    const { type, activated, kvps } = dealer;

    if (!acc[kvps] && type === 'SKRA' && activated) acc[kvps] = dealer;

    return acc;
  }, {} as Record<string, DealerSkoda>);

  return Object.keys(activatedSkraDealers).map((kvps) => {
    const dealer = activatedSkraDealers[kvps];
    return {
      address: dealer.address,
      city: dealer.city?.name || '',
      country: 'France',
      fax: '',
      id: dealer.contract_number,
      kvps: dealer.kvps,
      link: '',
      position: { lat: dealer.latitude, lng: dealer.longitude },
      postal_code: dealer.zip_code,
      tel: dealer.phone,
      title: dealer.trade_mark,
      type: dealer.type,
    };
  });
};

export default parseSkoda;
