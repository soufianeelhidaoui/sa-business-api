import {
	createSecretForKVPS,
	hasSecret,
	printSecretsManagerClientConfig,
	updateSecretForKVPS,
} from "@clients/secrets/secrets";
import config from "@config";
import type { KVPSSecret } from "@ts-types/smartpay.t";
import xlsx from "node-xlsx";
import readline from "node:readline";

const headers = {
	contratService: 0,
	KVPS: 1,
	companyRegistrationNumber: 2,
	merchantKey: 3,
	merchantSecret: 4,
	email: 5,
	lastName: 6,
	firstName: 7,
};

const importFile = async (filePath: string): Promise<void> => {
	const data = xlsx.parse(filePath);

	console.log(data);
	console.log(data[0].data[1]);

	let i = 1;

	while (i < data[0].data.length) {
		const row = data[0].data[i];
		i = i + 1;

		const kvps = row[headers.KVPS];

		const secret: KVPSSecret = {
			contract: row[headers.contratService],
			companyRegistrationNumber: row[headers.companyRegistrationNumber],
			merchantKey: row[headers.merchantKey],
			merchantSecret: row[headers.merchantSecret],
			email: row[headers.email],
			firstName: row[headers.firstName],
			lastName: row[headers.lastName],
		};

		if (!(await hasSecret(kvps))) {
			console.log(`no secret found for ${kvps}, creating it...`);
			await createSecretForKVPS(kvps, secret);
			console.log(`secret for ${kvps} created`);
		} else {
			console.log(`secret for ${kvps} found, updating it...`);
			await updateSecretForKVPS(secret);
			console.log(`secret for ${kvps} updated`);
		}
	}

	return;
};

const importConfirmed = async (): Promise<boolean> => {
	return new Promise<boolean>((resolve) => {
		const input = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		input.question("Do you wish to continue? (Y/n)", (answer) => {
			if (answer === "Y") {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
};

export const importKVPSSecrets = async () => {
	console.log("This script is used to import KVPS secrets into AWS");
	console.log("Use it at your own risks!");

	console.log("Secrets client configuration:");
	printSecretsManagerClientConfig();

	const filePath = config.get("VITE_KVPS_SECRET_IMPORT_FILE_PATH");
	console.log(`file: ${filePath}`);

	if (!(await importConfirmed())) {
		console.log("Import cancelled");
		return;
	}

	console.log("Importing secrets...");

	await importFile(filePath);
};
