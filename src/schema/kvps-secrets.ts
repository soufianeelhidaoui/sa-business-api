import { Schema, model, type Document, type Model } from "mongoose";

export interface IKVPSSecret extends Document {
	kvps: string;
	registrationNumber: string;
}

const KVPSSecretSchema: Schema = new Schema({
	kvps: { required: true, type: String },
	registrationNumber: { required: true, type: String },
});

export const KVPSSecretModel: Model<IKVPSSecret> = model(
	"KVPSSecret",
	KVPSSecretSchema,
);
