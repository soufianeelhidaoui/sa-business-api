// scheduler is a service that wrap any cron like library to schedule jobs

import config from "@config";
import {
	ScheduledJobMetadata,
	type ScheduledJobStatus,
} from "@schema/scheduled-jobs";
import logger from "@utils/logger";
import schedule from "node-schedule";
import type { Logger as PinoLogger } from "pino";

// *    *    *    *    *    *
// ┬    ┬    ┬    ┬    ┬    ┬
// │    │    │    │    │    │
// │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
// │    │    │    │    └───── month (1 - 12)
// │    │    │    └────────── day of month (1 - 31)
// │    │    └─────────────── hour (0 - 23)
// │    └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)

export const PredefinedScheduledSpec: { [key: string]: string } = {
	EVERY_SECOND: "* * * * * *",
	EVERY_MINUTE: "0 * * * * *",
	EVERY_HOUR: "0 0 * * * *",
	EVERY_TWELVE_HOUR: "0 0 */12 * * *",
	EVERY_MIDDAY: "0 0 12 * * *",
	EVERY_MIDDNIGHT: "0 0 0 * * *",
};

let maxConcurrentJobs: number = Number.parseInt(
	config.get("VITE_SCHEDULER_MAX_CONCURRENT_JOB"),
);

if (Number.isNaN(maxConcurrentJobs)) {
	maxConcurrentJobs = 5;
}

export type ScheduledCallback = (
	logger: PinoLogger,
	args?: unknown,
) => Promise<unknown>;
export type ScheduledJobOptions = {
	name: string;
	Fn: ScheduledCallback;
	spec: string;
	args?: unknown;
};

export type ScheduledJob = {
	options: ScheduledJobOptions;
};

let jobs: { [name: string]: ScheduledJob } = {};

export const shutDownScheduler = async () => {
	jobs = {};
	await schedule.gracefulShutdown();
};

const executeJob = async (
	job: ScheduledJob,
	logger: PinoLogger,
): Promise<void> => {
	await job.options.Fn(logger, job.options.args);
};

const unlockJob = async (
	name: string,
	status: ScheduledJobStatus,
): Promise<void> => {
	await ScheduledJobMetadata.findOneAndUpdate(
		{ name: name, locked: true },
		{
			locked: false,
			status: status,
		},
	);
	return;
};

const lockJob = async (name: string, firedDate: Date): Promise<boolean> => {
	const job = schedule.scheduledJobs[name];
	const metadata = await ScheduledJobMetadata.findOneAndUpdate(
		{ name: name, locked: false },
		{
			locked: true,
		},
		{ new: true },
	);

	if (!metadata) {
		return false;
	}

	// Another instance took care of this job, this may happens if this instance has been too busy at some point
	// we just skip this schedule in that case.
	if (metadata.next && firedDate.getTime() < metadata.next.getTime()) {
		logger.info("seems to me that I am wrong");
		await ScheduledJobMetadata.findOneAndUpdate(
			{ name: name },
			{ locked: false },
		);
		return false;
	}

	metadata.fired = firedDate;
	metadata.next = job.nextInvocation();
	metadata.status = "RUNNING";

	await ScheduledJobMetadata.findOneAndUpdate(
		{ name: name, locked: true },
		{ fired: firedDate, next: job.nextInvocation(), status: "RUNNING" },
	);

	return true;
};

export const startScheduler = () => {
	let nbConcurrentJobs = 0;
	for (const name of Object.keys(jobs)) {
		const job = jobs[name];
		schedule.scheduleJob(
			job.options.name,
			job.options.spec,
			async (firedDate: Date): Promise<void> => {
				const log = logger.child({
					service: "scheduler",
					job: job.options.name,
				});
				if (nbConcurrentJobs === maxConcurrentJobs) {
					// TODO: maybe try to schedule later, but hopefully another instance will take this trigger.
					logger.info("maximum concurrent jobs reach, skipping...");
					return;
				}
				const locked = await lockJob(job.options.name, firedDate);
				if (!locked) {
					return;
				}
				nbConcurrentJobs++;

				log.info("job locked, running...");
				try {
					await executeJob(job, log);
					await unlockJob(job.options.name, "SUCCESS");
					log.info("job finished successfully!");
				} catch (err: unknown) {
					log.error(`job failed with error: ${err}`);
					await unlockJob(job.options.name, "FAILED");
				}
				nbConcurrentJobs--;
			},
		);
	}
};

export const addScheduledJob = async (job: ScheduledJobOptions) => {
	if (jobs[job.name]) {
		throw new Error(
			`job with name ${job.name} already exist. Job names shall be unique`,
		);
	}

	let existing = await ScheduledJobMetadata.findOne({ name: job.name });
	if (!existing) {
		existing = await ScheduledJobMetadata.create({
			name: job.name,
		});
	}

	jobs[job.name] = { options: job };
};
