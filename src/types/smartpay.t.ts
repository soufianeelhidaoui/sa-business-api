export type PaymentStatus =
	| "CREATED"
	| "AUTHORIZATION_INITIALIZED"
	| "AUTHORIZATION_COMPLETED"
	| "CAPTURE_PENDING"
	| "CAPTURED"
	| "REFUNDED";

export type ModificationAmout = {
	currencyCode: string;
	description: string;
	amount: number;
	option?: string;
};

export type StatusHistory = {
	status: PaymentStatus;
	statusDate: Date;
	modificationAmount: ModificationAmout;
};

export type PaymentModification = {
	modificationData: {
		type: string;
		modificationId: string;
		reconciliationReferenceId: string;
	};
	creationDate: Date;
	modificationAmount: ModificationAmout;
	status: PaymentStatus;
	lastStatusDate: Date;
	statusHistory: StatusHistory[];
};

export type PaymentStatusPayload = {
	description: string;
	paymentStatus: PaymentStatus;
	creationDate: Date;
	statusHistory: StatusHistory[];
	modifications: PaymentModification[];
	lastStatusDate: Date;
	reconciliationReferenceId: string;
	transactionOverview: {
		transactionId: string;
		paymentMethod: string;
		amount: number;
		currencyCode: string;
	};
};

export interface SmartPayNotification {
	id: string;
	createdAt: Date;
	origin: string;
	eventType: string;
	objectId: string;
	objectType: string;
	metadata: unknown;
	sourceSystem: string;
}

export interface SmartPayCheckoutType {
	transactionId: string;
	checkoutToken: string;
	paymentStatus: string;
	requestTime: Date;
	externalOrderReference: string;
}

export interface KVPSSecret {
	contract: string;
	companyRegistrationNumber: string;
	merchantKey: string;
	merchantSecret: string;
	email: string;
	firstName: string;
	lastName: string;
}

export type PathLike = string | Buffer | URL;
