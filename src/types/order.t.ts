export type orderState =
	| "new"
	| "confirmed"
	| "fulfilled"
	| "completed"
	| "cancelled";

export const orderStateList = [
	"new",
	"confirmed",
	"fulfilled",
	"completed",
	"cancelled",
];

export interface IItems {
	id: number;
	name: string;
	code: string;
	quantity: number;
	total: number;
	image: string;
	price: number;
}

export interface IOrder {
	id: number;
	number: string;
	serviceCenterId: string;
	state: orderState;
	total: number;
	countItems: number;
	notes: string;
	items: IItems[];
	customer: {
		firstName: string;
		lastName: string;
		phoneNumber: string;
		email: string;
		street: string;
		postcode: string;
		city: string;
		countryCode: string;
	};
	error: boolean;
}

export interface UpdateOrderConfig {
	kvps: string;
	brand: string;
	orderId: string;
	state: string;
	notes: string;
}
