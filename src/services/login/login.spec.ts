import { jwtDecode } from "jwt-decode";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { generateToken } from "@services/login/login";

import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { mockClient } from "aws-sdk-client-mock";
import { testDatas } from "./login.spec.data";

describe("The login service", () => {
	const smClientMock = mockClient(SecretsManagerClient);

	beforeAll(() => {
		vi.stubEnv("VITE_AWS_REGION", "eu-west-3");
		vi.stubEnv("AWS_ACCESS_KEY_ID", "My-AWESOME-Key");
		vi.stubEnv("AWS_SECRET_ACCESS_KEY", "My-AWESOME-Secret");

		smClientMock.on(GetSecretValueCommand).resolves({ SecretString: "{}" });
	});

	afterAll(() => {
		smClientMock.reset();
		vi.unstubAllEnvs();
	});

	test.each(testDatas)(
		"Should be able to read user data and generate a valid token ($name)",
		async (testData) => {
			vi.stubEnv("VITE_JWT_SECRET", "a-random-value");
			const token = await generateToken(testData.input);
			expect(token).toBeDefined();

			const decoded = jwtDecode(token);
			const expected = JSON.parse(testData.expected);

			expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);

			expect(decoded).toBeDefined();
			expect(decoded.contracts).toEqual(expected.contracts);
		},
	);
});
