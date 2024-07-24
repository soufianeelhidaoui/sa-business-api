import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import FormData from "form-data";
import { jwtDecode } from "jwt-decode";
import type { DefaultContext, DefaultState, ParameterizedContext } from "koa";
import NodeCache from "node-cache";
import { Agent } from "node:https";

import config from "@config";
import { type Brand, BrandList } from "@ts-types/brand.t";
import type { IOrder } from "@ts-types/order.t";
import logger from "@utils/logger";
import { getSyliusAPI } from "@utils/sylius-apis-configs";

const syliusTokenCacheOptions: NodeCache.Options = {
	checkperiod: Number.parseInt(
		config.get("VITE_SYLIUS_TOKEN_CACHE_CHECK_PERIOD_SECONDS") || "5",
	),
	deleteOnExpire: false,
	stdTTL:
		Number.parseInt(config.get("VITE_SYLIUS_TOKEN_CACHE_TTL_MINUTES") || "45") *
		60,
};

const syliusTokenCache = new NodeCache(syliusTokenCacheOptions);

const getToken = async (brand: Brand): Promise<string> => {
	try {
		logger.info(`Getting token for ${brand}`);
		const apiConfig = getSyliusAPI(brand);

		const api: AxiosInstance = axios.create({
			baseURL: apiConfig.apiURL,
			headers: {
				Accept: "application/json",
			},
			httpsAgent: new Agent({
				rejectUnauthorized: false,
			}),
		});

		const payload = {
			email: apiConfig.username,
			password: apiConfig.password,
		};
		const response = await api.post(
			"/api/service_center/authentication-token",
			payload,
		);
		if (response.status === 200) {
			logger.info(`Token retrieved successfully for ${brand}`);
			return response.data.token;
		}
		logger.error(
			"Failed to fetch sylius token: ",
			`status: ${response.status}`,
			`message: ${response.data}`,
			`brand: ${brand}`,
		);
		return "";
	} catch (err: unknown) {
		logger.error(err, `Could not initialize token for ${brand}`);
		return "";
	}
};

const refreshCachedToken = async (
	brand: Brand,
	oldValue: string | undefined,
) => {
	const token = await getToken(brand);
	if (token === "") {
		const ttl =
			config.get("VITE_SYLIUS_TOKEN_CACHE_TTL_ON_FAILURE_SECONDS") || 60;
		logger.info(`Cached token not updated, retrying in ${ttl} seconds`);
		syliusTokenCache.set(brand, oldValue, ttl);
	} else {
		syliusTokenCache.set(brand, token);
	}
};

syliusTokenCache.on("expired", async (key, old) => {
	await refreshCachedToken(key, old);
});

export const initSyliusTokens = async () => {
	logger.info("Initializing Sylius tokens");
	const allPromises: Promise<unknown>[] = [];
	for (const brand of BrandList) {
		allPromises.push(refreshCachedToken(brand as Brand, undefined));
	}

	await Promise.all(allPromises);
};

const getSyliusClient = (brand: Brand) => {
	const apiConfig = getSyliusAPI(brand);
	const token = syliusTokenCache.get(brand) as string;

	return axios.create({
		baseURL: apiConfig.apiURL,
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		httpsAgent: new Agent({
			rejectUnauthorized: false,
		}),
	});
};

export const checkSyliusTokens = (
	ctx: ParameterizedContext<DefaultState, DefaultContext, unknown>,
): boolean => {
	let result = true;
	for (const brand of BrandList) {
		const token = syliusTokenCache.get(brand) as string;
		const decoded = jwtDecode(token);
		if (!decoded || Date.now() >= decoded.exp! * 1000) {
			ctx.logger.error(`Sylius token for ${brand} is not valid anymore`);
			result = false;
			break;
		}
	}

	return result;
};

export const updatePaymentStatus = async (
	brand: Brand,
	payload: unknown,
): Promise<AxiosResponse<unknown, unknown>> => {
	const response = await getSyliusClient(brand).post(
		"/smartpay/payment/webhook",
		payload,
	);
	return response;
};

export const updateTerms = async (
	brand: Brand,
	kvps: string,
	payload: unknown,
): Promise<unknown> => {
	const form = new FormData();
	form.append("file", payload.buffer, payload.originalname);
	const response = await getSyliusClient(brand).post(
		`/api/service_center/${kvps}/terms`,
		form,
		{ headers: form.getHeaders() },
	);
	return response;
};

export const getOrders = async (
	brand: Brand,
	kvps: string,
	query: string,
): Promise<AxiosResponse> => {
	const response = await getSyliusClient(brand).get(
		`/api/service_center/${kvps}/orders?${query}`,
	);
	return response;
};

export const getOrdersStats = async (
	brand: Brand,
	kvps: string,
): Promise<AxiosResponse> => {
	const response = await getSyliusClient(brand).get(
		`/api/service_center/${kvps}/orders/stats`,
	);
	return response;
};

export const updateOrder = async (
	brand: Brand,
	kvps: string,
	orderId: string,
	payload: { state: string; notes: string },
): Promise<AxiosResponse> => {
	const response = await getSyliusClient(brand).post(
		`/api/service_center/${kvps}/order/${orderId}`,
		payload,
	);
	return response;
};

export const getOrderDetails = async (
	brand: Brand,
	kvps: string,
	orderId: number,
): Promise<AxiosResponse<IOrder>> => {
	const response = await getSyliusClient(brand).get(
		`/api/service_center/${kvps}/order/${orderId}`,
	);

	return response;
};

export const getSyliusPrices = async (
	brand: Brand,
	kvps: string,
): Promise<unknown> => {
	// NOTE: we need to use try catch here to avoid error when file does not exists at Sylius side
	// because we should be permissive for this usecase and handle it like an empty file
	const response = await getSyliusClient(brand)
		.get(`/api/service_center/${kvps}/prices`)
		.catch((err) => {
			err.response.data.message === "Prices file does not exists"
				? Promise.resolve({})
				: Promise.reject(err);
		});

	return response;
};

export const updateSyliusPrices = async (
	brand: Brand,
	kvps: string,
	prices,
): Promise<unknown> => {
	const response = await getSyliusClient(brand).post(
		`/api/service_center/${kvps}/prices`,
		prices,
	);
	return response;
};
