import {
	GetSecretValueCommand,
	ResourceNotFoundException,
	SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { mockClient } from "aws-sdk-client-mock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSecretForKVPS, hasPayment, hasSecret } from "./secrets";

describe("The secret client", () => {
	const smClientMock = mockClient(SecretsManagerClient);

	beforeEach(() => {
		vi.stubEnv("VITE_AWS_REGION", "eu-west-3");
		vi.stubEnv("AWS_ACCESS_KEY_ID", "My-AWESOME-Key");
		vi.stubEnv("AWS_SECRET_ACCESS_KEY", "My-AWESOME-Secret");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		smClientMock.reset();
	});

	it("should be able to find a secret for a KVPS", async () => {
		smClientMock.on(GetSecretValueCommand).resolves({
			Name: "KVPS-1",
			SecretString: '{"kvps":"KVPS-1","merchantKey":"merchantKey"}',
		});

		const result = await getSecretForKVPS("KVPS-1");

		expect(result).toBeDefined();
		expect(result?.kvps).toBe("KVPS-1");
		expect(result?.merchantKey).toBe("merchantKey");

		const calls = smClientMock.commandCalls(GetSecretValueCommand);
		expect(calls.length).toBe(1);
		expect(calls[0].args[0].input.SecretId).toBe(
			"vgf/mechants/credentials/local/KVPS-1",
		);
	});

	it("should return undefined when secret does not exist", async () => {
		smClientMock.on(GetSecretValueCommand).callsFake(() => {
			throw new ResourceNotFoundException({
				$metadata: {},
				message: "Not Found",
			});
		});

		const result = await getSecretForKVPS("KVPS-2");

		expect(result).toBeUndefined();
	});

	it("should return true when calling hasSecret for existing secret", async () => {
		smClientMock.on(GetSecretValueCommand).resolves({
			Name: "KVPS",
			SecretString: '{"kvps":"KVPS","merchantKey":"merchantKey"}',
		});

		const result = await hasSecret("KVPS-3");

		expect(result).toBeDefined();
		expect(result).toBeTruthy();
	});

	it("should return false when calling hasSecret for non existing secret", async () => {
		smClientMock.on(GetSecretValueCommand).callsFake(() => {
			throw new ResourceNotFoundException({
				$metadata: {},
				message: "Not Found",
			});
		});

		const result = await hasSecret("KVPS-4");

		expect(result).toBeDefined();
		expect(result).toBeFalsy();
	});

	it("should return true when calling hasPayment with KVPS that has a secret and this secret contains merchantKey and Key", async () => {
		smClientMock.on(GetSecretValueCommand).resolves({
			Name: "KVPS-5",
			SecretString:
				'{"kvps":"KVPS","merchantKey":"merchantKey","merchantSecret":"Secret"}',
		});

		const result = await hasPayment("KVPS-5");

		expect(result).toBeDefined();
		expect(result).toBeTruthy();
	});

	it("should return false when calling hasPayment with KVPS that has a secret and this secret does not contain merchantKey and Key", async () => {
		smClientMock.on(GetSecretValueCommand).resolves({
			Name: "KVPS-6",
			SecretString: '{"kvps":"KVPS"}',
		});

		const result = await hasPayment("KVPS-6");

		expect(result).toBeDefined();
		expect(result).toBeFalsy();
	});
});
