import { ScheduledJobMetadata } from "@schema/scheduled-jobs";
import schedule from "node-schedule";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { delay } from "../utils/utils";
import {
  PredefinedScheduledSpec,
  addScheduledJob,
  shutDownScheduler,
  startScheduler,
} from "./scheduler";

const fromSpecToNextInvocation = (spec: string): Date => {
	const date = new Date();
	date.setMilliseconds(0);

	if (spec === "EVERY_SECOND") {
		date.setSeconds(date.getSeconds() + 1);
		return date;
	}
	date.setSeconds(0);
	if (spec === "EVERY_MINUTE") {
		date.setMinutes(date.getMinutes() + 1);
		return date;
	}

	date.setMinutes(0);

	if (spec === "EVERY_HOUR") {
		date.setHours(date.getHours() + 1);
	}

	if (spec === "EVERY_TWELVE_HOUR") {
		if (date.getHours() < 12) {
			date.setHours(12);
		} else {
			date.setHours(24);
		}
	}

	if (spec === "EVERY_MIDDAY") {
		if (date.getHours() >= 12) {
			date.setDate(date.getDate() + 1);
		}
		date.setHours(12);
	}

	if (spec === "EVERY_MIDDNIGHT") {
		date.setHours(24);
	}

	return date;
};

describe("The scheduler", () => {
	afterEach(async () => {
		vi.resetAllMocks();
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});

	it.each(Object.keys(PredefinedScheduledSpec))(
		"should be able to schedule job with spec %s",
		async (spec: string) => {
			vi.spyOn(ScheduledJobMetadata, "findOne").mockResolvedValue({});
			vi.spyOn(ScheduledJobMetadata, "findOneAndUpdate").mockResolvedValue({});

			await addScheduledJob({
				name: spec,
				spec: PredefinedScheduledSpec[spec],
				Fn: async () => {},
			});
			startScheduler();

			const result = schedule.scheduledJobs[spec];
			const expected = fromSpecToNextInvocation(spec);

			expect(result).toBeDefined();
			expect(result.nextInvocation().toISOString()).toEqual(
				expected.toISOString(),
			);
			await shutDownScheduler();
		},
	);

	it("should be able to gracefully shutdown jobs even when it has started", async () => {
		let nbStarted = 0;
		let nbFinished = 0;

		vi.spyOn(ScheduledJobMetadata, "findOne").mockResolvedValue({});
		const mock = vi
			.spyOn(ScheduledJobMetadata, "findOneAndUpdate")
			.mockResolvedValue({});
		await addScheduledJob({
			name: "graceful-testing-1",
			spec: PredefinedScheduledSpec.EVERY_SECOND,
			Fn: async () => {
				nbStarted++;
				await delay(2000);
				nbFinished++;
				return;
			},
		});

		await addScheduledJob({
			name: "graceful-testing-2",
			spec: PredefinedScheduledSpec.EVERY_SECOND,
			Fn: async () => {
				nbStarted++;
				await delay(2000);
				nbFinished++;
				return;
			},
		});
		startScheduler();

		await delay(1000);

		await shutDownScheduler();

		expect(nbStarted).toEqual(nbFinished);
		// This unit test seems unstable (should mock timers to make sure of the value)
		// But mock should have been called 4 times + 2 times for unlock
		expect(mock).toHaveBeenCalledTimes(5); // two lock, two unlock
	});

	it("should handle error properly", async () => {
		vi.spyOn(ScheduledJobMetadata, "findOne").mockResolvedValue({});
		const mock = vi
			.spyOn(ScheduledJobMetadata, "findOneAndUpdate")
			.mockResolvedValue({});
		await addScheduledJob({
			name: "unit-testing-error",
			spec: PredefinedScheduledSpec.EVERY_SECOND,
			Fn: async () => {
				throw new Error("A failing job");
			},
		});
		startScheduler();
		await delay(1000);
		await shutDownScheduler();
		expect(mock).toHaveBeenCalledTimes(3); // 1 lock, 1 update for nextInvocation, 1 unlock
	});

	it("should throw an error when adding the same job name more than once", async () => {
		vi.spyOn(ScheduledJobMetadata, "findOne").mockResolvedValue({});
		expect(async () => {
			await addScheduledJob({
				name: "unit-testing-throw",
				spec: PredefinedScheduledSpec.EVERY_SECOND,
				Fn: async () => {},
			});

			await addScheduledJob({
				name: "unit-testing-throw",
				spec: PredefinedScheduledSpec.EVERY_SECOND,
				Fn: async () => {},
			});
		}).rejects.toThrowError(
			"job with name unit-testing-throw already exist. Job names shall be unique",
		);
		await shutDownScheduler();
	});

	it("should create job metadata if it does not exist", async () => {
		vi.spyOn(ScheduledJobMetadata, "findOne").mockResolvedValue(null);
		const mock = vi.spyOn(ScheduledJobMetadata, "create").mockResolvedValue({});
		await addScheduledJob({
			name: "unit-testing-error",
			spec: PredefinedScheduledSpec.EVERY_SECOND,
			Fn: async () => {
				await delay(500);
				throw new Error("A failing job");
			},
		});

		expect(mock).toHaveBeenCalledOnce();
	});

	it("should not start a job if it can not lock it", async () => {
		let nbStarted = 0;
		let nbFinished = 0;
		vi.spyOn(ScheduledJobMetadata, "findOne").mockResolvedValue({});
		vi.spyOn(ScheduledJobMetadata, "findOneAndUpdate").mockResolvedValue(null);

		await addScheduledJob({
			name: "graceful-testing-1",
			spec: PredefinedScheduledSpec.EVERY_SECOND,
			Fn: async () => {
				nbStarted++;
				await delay(2000);
				nbFinished++;
				return;
			},
		});

		startScheduler();
		await delay(2000);

		expect(nbFinished).toEqual(0);
		expect(nbStarted).toEqual(0);
	});
});
