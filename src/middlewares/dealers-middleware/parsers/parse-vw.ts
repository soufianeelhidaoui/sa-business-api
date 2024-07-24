import { Dealer, DealerVW } from '@ts-types/dealers.t';

export type ParseVWFn = (dealers: DealerVW[]) => Dealer[];

const parseVw: ParseVWFn = (dealers) =>
  dealers.map((dealer) => ({
    address: dealer.address1,
    city: dealer.city,
    country: 'France',
    fax: '',
    id: dealer.contract_number,
    kvps: dealer.kvps,
    link: dealer.partner_url,
    position: { lat: dealer.latitude, lng: dealer.longitude },
    postal_code: dealer.zip_code,
    tel: dealer.phone_number,
    title: dealer.name,
  }));

export default parseVw;
