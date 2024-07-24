import { Dealer, DealerSeat } from '@ts-types/dealers.t';

export type ParseSeatFn = (dealers: DealerSeat[]) => Dealer[];

const parseSeat: ParseSeatFn = (dealers) =>
  dealers.map((dealer) => ({
    address: dealer.adresse,
    city: dealer.ville,
    country: 'France',
    fax: dealer.fax,
    id: dealer.id,
    kvps: dealer.kvps_de,
    link: dealer.website_seat,
    position: { lat: parseFloat(dealer.latitude), lng: parseFloat(dealer.longitude) },
    postal_code: dealer.code_postal,
    tel: dealer.telephone,
    title: dealer.raison_sociale,
  }));

export default parseSeat;
