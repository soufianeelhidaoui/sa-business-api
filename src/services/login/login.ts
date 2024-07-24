import { XMLParser } from "fast-xml-parser";
import jwt from "jsonwebtoken";

import { GVFApiClient, type GVFApiClientAuthType } from "@clients/gvf/gvf";
import { hasSecret } from "@clients/secrets/secrets";
import config from "@config";
import getDealers from "@services/dealers/get-dealers";

const readFirm = async (firms: object): Promise<object> => {
	let firmList = [];
	const result: object[] = [];
	if (!Array.isArray(firms)) {
		firmList.push(firms);
	} else {
		firmList = firms;
	}

	for (const firm of firmList) {
		const brand: unknown[] = Array.isArray(firm.BRANDS.BRAND)
			? firm.BRANDS.BRAND
			: [firm.BRANDS.BRAND];

		for (const value of brand) {
			const key = value["#text"].toLowerCase().replace("vu", "vwu");
			const contract = value.CONTRATS?.CONTRACT || value.CONTRATS?.CONTRAT;
			let contractList = [];
			if (!Array.isArray(contract)) {
				contractList.push(contract);
			} else {
				contractList = contract;
			}

			for (const con of contractList) {
				if (con === undefined) {
					continue;
				}
				const kvps = con["@_KVPS"];
				if (kvps === "") continue;

				if (!(await hasSecret(kvps))) continue; // Filter out any KVPS that have not been unboarded

				if (!result[key]) {
					result[key] = [kvps];
				} else {
					result[key].push(kvps);
				}
			}
		}
	}

	const cupraKvps = await getDealers('cupra');

	const contracts = Object.keys(result).reduce((prev, current) => {
		const filtredDuplicatedKVPSResult = [...new Set(result[current])];
		const kvpsList = [...filtredDuplicatedKVPSResult].map((kvps) => ({
			brand: current,
			kvps,
			isSharedKvpsCupraNSeat: cupraKvps.map((item) => item.kvps).includes(kvps as string),
		}));

		return [...prev, ...kvpsList];
	}, []);

	return { contracts };
};

export const generateToken = async (xmlContent: string): Promise<string> => {
	const parser = new XMLParser({
		attributeNamePrefix: "@_",
		ignoreAttributes: false,
	});
	const data = parser.parse(xmlContent);
	let firms: object = {};
	if (data.MESSAGE.RESULT.RESPONSE["@_VERSION"] === "3.0") {
		firms = data.MESSAGE.RESULT.RESPONSE.DATA.USERDATA.MAINFIRM.SUBFIRM;
	} else {
		if (Array.isArray(data.MESSAGE.RESULT.RESPONSE)) {
			for (const innerData of data.MESSAGE.RESULT.RESPONSE) {
				if (innerData.DATA.USERDATA) {
					firms = { BRANDS: innerData.DATA.USERDATA.BRANDS };
					break;
				}
			}
		} else {
			if (data.MESASGE.RESULT.RESPONSE.DATA.USERDATA) {
				firms = { BRANDS: data.MESSAGE.RESULT.RESPONSE.DATA.USERDATA.BRANDS };
			}
		}
	}
	const result = await readFirm(firms);
	const token = jwt.sign(result, config.get("VITE_JWT_SECRET"), {
		expiresIn: "24h",
	});
	return token;
};

export const login = async (payload: GVFApiClientAuthType): Promise<string> => {
	const gvfClient = new GVFApiClient();

	const result = await gvfClient.login(payload);
	const token = await generateToken(result);
	return token;
};
