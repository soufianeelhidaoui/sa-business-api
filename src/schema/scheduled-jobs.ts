import { Schema, model, type Document, type Model } from "mongoose";

export type ScheduledJobStatus = "RUNNING" | "FAILED" | "SUCCESS";

export interface IScheduledJobMetadata extends Document {
	name: string;
	fired?: Date;
	next?: Date;
	locked: boolean;
	status: ScheduledJobStatus;
}

const ScheduledJobMetadataSchema: Schema = new Schema({
	name: { required: true, type: String, unique: true },
	fired: { required: false, type: Date },
	next: { required: false, type: Date },
	locked: { required: true, type: Boolean, default: false },
	status: { required: false, type: String },
});

export const ScheduledJobMetadata: Model<IScheduledJobMetadata> = model(
	"ScheduledJobMetadata",
	ScheduledJobMetadataSchema,
);
