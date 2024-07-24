import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { BrandList } from "@ts-types/brand.t";
import { mockClient } from "aws-sdk-client-mock";
import { readFileSync } from "node:fs";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { executeTemplate, sendCustomer } from "./email";
import { templateData } from "./email.spec.data";

for (const brand of BrandList) {
	vi.stubEnv(
		`VITE_${brand.toUpperCase()}_SYLIUS_API_URL`,
		`${brand.toUpperCase()}_API_URL`,
	);
	vi.stubEnv(
		`VITE_${brand.toUpperCase()}_SYLIUS_API_USERNAME`,
		`${brand.toUpperCase()}_API_USERNAME`,
	);
	vi.stubEnv(
		`VITE_${brand.toUpperCase()}_SYLIUS_API_PASSWORD`,
		`${brand.toUpperCase()}_API_PASSWORD`,
	);
}

describe("The email client", () => {
	const sesMock = mockClient(SESv2Client);

	beforeAll(() => {
		vi.stubEnv("VITE_AWS_REGION", "eu-west-3");
	});

	afterEach(() => {
		sesMock.reset();
	});

	it("should throw an error when using an unknown template", () => {
		const data = structuredClone(templateData);
		sesMock.on(SendEmailCommand).resolves({});

		expect(async () => {
			return await sendCustomer({
				template: {
					name: "unknown",
					data: data,
				},
			});
		}).rejects.toThrowError(
			"Tried to send email with an unknown template, asked [unknown], known templates are [dealer-notification,confirmed,fulfilled,cancelled,approved]",
		);
	});

	it("should throw an error when sending email to no destination", () => {
		sesMock.on(SendEmailCommand).resolves({});

		expect(async () => {
			return await sendCustomer({
				destination: {
					toAdresses: [],
				},
				template: {
					name: "confirmed",
					data: { orderDetails: { customer: { email: undefined } } },
				},
			});
		}).rejects.toThrowError("Can not send an email if we don't know who to");
	});

	it("should throw an error when SES client rejects the command", () => {
		const data = structuredClone(templateData);
		sesMock.on(SendEmailCommand).rejects();

		expect(async () => {
			return await sendCustomer({
				template: {
					name: "confirmed",
					data: data,
				},
			});
		}).rejects.toThrowError();
	});

	it("should be able to send email", async () => {
		const data = structuredClone(templateData);
		sesMock.on(SendEmailCommand).resolves({});

		const response = await sendCustomer({
			config: { fromAddress: "anyhow", fromAddressARN: "anywho" },
			destination: { toAdresses: ["hello"] },
			template: { name: "confirmed", data: data },
		});
		expect(response).toBeDefined();
	});
});

describe("Email templates", () => {
	it.each([
		"approved",
		"cancelled",
		"confirmed",
		"fulfilled",
		"dealer-notification",
	])(
		"should be able to use the %s template",
		async (name: string) => {
			const data = structuredClone(templateData);
			const result = await executeTemplate(name, data);

			const expected = readFileSync(
				`./src/clients/email/templates/expected/${name}.expected.html`,
			);

			expect(result.toString()).toEqual(expected.toString());
		},
		{ timeout: 50000 },
	);
});
