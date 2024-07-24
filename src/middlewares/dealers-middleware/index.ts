import { HttpStatusCode } from "axios";
import type { Middleware } from "koa";
import NodeCache from "node-cache";

import getDealers from "@app/services/dealers/get-dealers";
import config from "@config";
import { type Brand, BrandList } from "@ts-types/brand.t";
import logger from "@utils/logger";

const nodeCacheOption: NodeCache.Options = {
	checkperiod: Number.parseInt(
		config.get("VITE_DEALERS_CACHE_CHECK_PERIOD_SECONDS") || "10",
	),
	deleteOnExpire: false,
	stdTTL:
		Number.parseInt(config.get("VITE_DEALERS_CACHE_TTL_HOURS") || "1") * 3600,
};

const dealersCache = new NodeCache(nodeCacheOption);

const updateCache = async (brand: Brand, oldValue: unknown) => {
	logger.info(`Updating dealer cache for brand ${brand}`);
	try {
		const dealers = await getDealers(brand);
		dealersCache.set(brand, dealers || []);
		logger.info(`Cache for brand ${brand} updated`);
	} catch (err: unknown) {
		logger.error(err, `Failed to update dealer cache for brand ${brand}`);
		const ttl = config.get("VITE_DEALERS_CACHE_TTL_ON_FAILURE_SECONDS") || 60;
		logger.warn(
			`Failed to update dealer cache for brand ${brand} retrying in ${ttl} seconds`,
		);
		dealersCache.set(brand, oldValue || [], ttl);
	}
};

dealersCache.on("expired", async (key, old) => {
	await updateCache(key, old);
});

export async function initDealersCache() {
	logger.info("Initializing dealers cache...");
	const allPromises: Promise<void>[] = [];
	BrandList.forEach((brand: string) => {
		allPromises.push(updateCache(brand as Brand, undefined));
	});
	await Promise.all(allPromises);
	logger.info("Initializing dealers cache done");
}

/*
  Gets the dealers from the cache if the key exists
    Retrieves the dealers and sets the cache accordingly otherwise.
*/

const dealersMiddleware: Middleware = async (ctx, next) => {
	ctx.logger.info(`Fetching delears for ${ctx.params.brand}`);
	const { brand } = ctx.params;

	const dealers = dealersCache.get(brand)!;
	if (!dealers) {
		ctx.throw(
			HttpStatusCode.NotFound,
			`Could not find dealers for brand: ${brand}`,
		);
	}

	ctx.state.dealers = dealers;
	ctx.logger.info("dealers found successfully");
	return next();
};

export default dealersMiddleware;
