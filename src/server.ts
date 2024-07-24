import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { connect } from "mongoose";

import { initSyliusTokens } from "@clients/sylius/sylius";
import config from "@config";
import cors from "@koa/cors";
import { initDealersCache } from "@middlewares/dealers-middleware";
import routes from "@routes";
import logger from "@utils/logger";
import { callbackify } from "node:util";
import { initReconcilePaymentJobs } from "./jobs/reconcile-payment";
import { shutDownScheduler, startScheduler } from "./scheduler/scheduler";
import { importKVPSSecrets } from "./scripts/import-kvps-sercrets";

if (config.get("VITE_SCRIPT_MODE") === "true") {
	await connect(config.get("VITE_MONGOOSE_URL"), {});
	await importKVPSSecrets();
	process.exit(0);
}

await connect(config.get("VITE_MONGOOSE_URL"), {});
await initDealersCache();
await initSyliusTokens();

await initReconcilePaymentJobs();
startScheduler();

const app = new Koa();

app.use(cors({ origin: "*" }));
app.use(bodyParser());

for (const route of routes) {
	app.use(route.routes());
	app.use(route.allowedMethods());
}

if (import.meta.env.PROD) {
	const PORT = Number.parseInt(config.get("VITE_PORT") || "6000");
	const server = app.listen(PORT, async () => {
		console.log(`Running at http://locahost:${PORT}`);
	});
	let shuttingDown = false;
	for (const signal of ["SIGINT", "SIGTERM"]) {
		process.on(signal, (s) => {
			if (shuttingDown) return;
			shuttingDown = true;
			logger.info(`received signal ${s}, gracefully shuttingdown server...`);
			server.close(() => {
				logger.info("server successfully shutdown!");
				callbackify(shutDownScheduler)(() => {
					logger.info("scheduler successfully shutdown!");
					process.exit(0);
				});
			});
		});
	}
}

export const saBusinessApiApp = app;
