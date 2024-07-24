import {
	PredefinedScheduledSpec,
	addScheduledJob,
} from "@app/scheduler/scheduler";
import { delay } from "@utils/utils";
import type { Logger as PinoLogger } from "pino";

type JobArguments = {
	BRAND: string;
};

const demoJob = async (logger: PinoLogger, args: unknown) => {
	const argument = args as JobArguments;
	logger.info(`hello from demo job ${argument.BRAND}`);
	await delay(30 * 1000);
	return;
};

export const initDemoJob = async () => {
	await addScheduledJob({
		name: "demo-job-skoda",
		spec: PredefinedScheduledSpec.EVERY_MINUTE,
		Fn: demoJob,
		args: {
			BRAND: "skoda",
		},
	});
	await addScheduledJob({
		name: "demo-job-cupra",
		spec: PredefinedScheduledSpec.EVERY_MINUTE,
		Fn: demoJob,
		args: {
			BRAND: "cupra",
		},
	});
};
