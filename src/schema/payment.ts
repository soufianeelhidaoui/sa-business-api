import { type Document, type Model, Schema, model } from "mongoose";

import type { Brand } from "@ts-types/brand.t";

export interface IPaymentInfo extends Document {
	transactionId: string;
	brand: Brand;
	kvps: string;
	orderId: number;
	locked: boolean;
	captured: boolean;
	refund: boolean;
	needsReconciliation: boolean;
	confirmationSent: boolean;
	updatedAt?: Date;
	createdAt?: Date;
}

const PaymentInfoSchema: Schema = new Schema(
	{
		brand: { required: true, type: String },
		kvps: { required: true, type: String },
		transactionId: { required: true, type: String },
		orderId: { required: true, type: Number },
		captured: { requred: true, type: Boolean, default: false },
		refund: { required: true, type: Boolean, default: false },
		locked: { required: true, type: Boolean, default: false },
		confirmationSent: { required: true, type: Boolean },
		needsReconciliation: { required: true, type: Boolean, default: false },
	},
	{ timestamps: true },
);

export const PaymentInfo: Model<IPaymentInfo> = model(
	"PaymentInfo",
	PaymentInfoSchema,
);
