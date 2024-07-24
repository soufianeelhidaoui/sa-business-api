/*
  SEAT
*/

export interface DealerSeat {
  id: string;
  kvps: string;
  kvps_de: string;
  code_ce: string;
  district: string;
  occasion: string;
  distrib_type: string;
  service_center: string;
  raison_sociale: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  fax: string;
  telephone_abbr: string;
  fax_abbr: string;
  latitude: string;
  longitude: string;
  email: string;
  website: string;
  website_seat: string;
  seat_access: string;
  cupra_access: string;
  cupra_plus_access: string;
  created: string;
  modified: string;
}

/*
  VW / VWU
*/

type DaysKeys = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DealerVW {
  contract_number: string;
  name: string;
  address1: string;
  address2: string;
  zip_code: string;
  city: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  tyre_prestations: Record<string, number>;
  opening_hours: Record<DaysKeys, string>;
  kvps: string;
  partner_url: string;
}

/*
  Skoda
*/

interface DistrictData {
  code: string;
  name: string;
}

export interface DealerSkoda {
  contract_number: string;
  kvps: string;
  type: string;
  trade_mark: string;
  address: string;
  reference_near_city_text: string;
  city?: {
    name: string;
  };
  zip_code: string;
  phone: string;
  fax: string;
  latitude: number;
  longitude: number;
  visible: boolean;
  published: boolean;
  activated: boolean;
  district: DistrictData;
  district_new_vehicles: DistrictData;
  district_after_sales: DistrictData;
  freespee_enabled: boolean;
  updated_at: string;
  rapid_rtc: boolean;
  up_your_leads: boolean;
  auto_manager: boolean;
  leads_piot: boolean;
  live_shopping: boolean;
  friendly_name: string;
}

/*
  utils
*/

export type BrandDealerTypeMap = {
  vw: DealerVW;
  vwu: DealerVW;
  seat: DealerSeat;
  skoda: DealerSkoda;
};

/*
  parsed
*/

export interface Dealer {
  id: string;
  link: string;
  title: string;
  tel: string;
  fax: string;
  city: string;
  country: string;
  position: {
    lat: number;
    lng: number;
  };
  address: string;
  postal_code: string;
  kvps: string;
}

export default DealerVW;
