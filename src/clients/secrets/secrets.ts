import {
	CreateSecretCommand,
	GetSecretValueCommand,
	ListSecretsCommand,
	ResourceNotFoundException,
	SecretsManagerClient,
	UpdateSecretCommand,
	type CreateSecretCommandOutput,
	type UpdateSecretCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import config from "@config";
import { KVPSSecretModel } from "@schema/kvps-secrets";
import type { KVPSSecret } from "@ts-types/smartpay.t";
import NodeCache from "node-cache";

const secretsCacheOptions: NodeCache.Options = {
	checkperiod:
		Number.parseInt(
			config.get("VITE_BUSINESS_API_SECRETS_CACHE_CHECK_PERIOD_MINUTES") ||
				"60",
		) * 60,
	deleteOnExpire: true,
	stdTTL:
		Number.parseInt(
			config.get("VITE_BUSINESS_API_SECRETS_CACHE_TTL_MINUTES") || "1440",
		) * 60,
};

const disableCache = config.get("VITE_BUSINESS_API_DISABLE_CACHE") === "true";
const secretsCache = new NodeCache(secretsCacheOptions);
const secretIdPrefix =
	config.get("VITE_BUSINESS_API_SECRETS_PREFIX") ||
	"vgf/mechants/credentials/local";

const smClient = new SecretsManagerClient({
	region: config.get("VITE_AWS_REGION"),
});

export const checkSecretsManagerClient = async (): Promise<boolean> => {
	const response = await smClient.send(
		new ListSecretsCommand({
			MaxResults: 1,
		}),
	);

	return response !== undefined;
};

export const getSecretForKVPS = async (
	kvps: string,
): Promise<KVPSSecret | undefined> => {
	if (!disableCache && secretsCache.has(kvps)) {
		return secretsCache.get(kvps);
	}

	try {
		const contract = await KVPSSecretModel.findOne({ kvps: kvps });
		if (!contract) {
			if (!disableCache) {
				secretsCache.set(kvps, undefined);
			}
			return undefined;
		}

		const response = await smClient.send(
			new GetSecretValueCommand({
				SecretId: `${secretIdPrefix}/${contract.registrationNumber}`,
			}),
		);

		const secret = { kvps, ...JSON.parse(response.SecretString ?? "{}") };

		if (!disableCache) {
			secretsCache.set(kvps, secret);
		}

		return secret;
	} catch (err: unknown) {
		if (err instanceof ResourceNotFoundException) {
			if (!disableCache) {
				secretsCache.set(kvps, undefined);
			}
			return undefined;
		}
		throw err;
	}
};

export const printSecretsManagerClientConfig = () => {
	console.log(`AWS Region: ${config.get("VITE_AWS_REGION")}`);
	console.log(`Secret prefix: ${secretIdPrefix}`);
};

// This will returns true if a secret is prepared for the given KVPS.
// It doesn't mean that merchantKey and Key are available, just that the KVPS is onboarded
export const hasSecret = async (kvps: string): Promise<boolean> => {
	const secret = await getSecretForKVPS(kvps);

	return !!secret;
};

// This will returns true only if the given KVPS has a merchantKey and a Key
export const hasPayment = async (kvps: string): Promise<boolean> => {
	const secret = await getSecretForKVPS(kvps);

	if (
		secret?.merchantKey &&
		secret.merchantKey !== "" &&
		secret?.merchantSecret &&
		secret.merchantSecret !== ""
	) {
		return true;
	}

	return false;
};

export const createSecretForKVPS = async (
	kvps: string,
	secret: KVPSSecret,
): Promise<CreateSecretCommandOutput | undefined> => {
	const saved = await KVPSSecretModel.create({
		kvps: kvps,
		registrationNumber: secret.companyRegistrationNumber,
	});

	await saved.save();

	if (!(await hasSecret(kvps))) {
		const cmd = new CreateSecretCommand({
			Name: `${secretIdPrefix}/${secret.companyRegistrationNumber}`,
			SecretString: JSON.stringify(secret),
		});

		const response = await smClient.send(cmd);

		return response;
	}

	return undefined;
};

export const updateSecretForKVPS = async (
	secret: KVPSSecret,
): Promise<UpdateSecretCommandOutput> => {
	const cmd = new UpdateSecretCommand({
		SecretId: `${secretIdPrefix}/${secret.companyRegistrationNumber}`,
		SecretString: JSON.stringify(secret),
	});

	const response = await smClient.send(cmd);

	return response;
};
