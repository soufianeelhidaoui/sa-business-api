import type { Brand } from "./brand.t";
import type { Dealer } from "./dealers.t";
import type { IOrder } from "./order.t";

export interface Referent {
	firstName: string;
	lastName: string;
	email: string;
}

export interface TemplateData {
	emailLogo: string;
	emailHero: string;
	websiteURL: string;
	privacyPolicyURL: string;
	brand: Brand;
	partner: Dealer;
	referent: Referent;
	orderDetails: IOrder;
}

export interface SendEmailConfig {
	config: {
		fromAddress: string;
		fromAddressARN: string;
	};
	template: {
		name: string;
		data: TemplateData;
	};
}
