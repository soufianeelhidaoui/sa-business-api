import { HttpStatusCode } from "axios";
import type { Middleware } from "koa";
import mongoose from "mongoose";

import { checkSecretsManagerClient } from "@clients/secrets/secrets";
import { checkSyliusTokens } from "@clients/sylius/sylius";

/*
  This middleware just check various things in the API to make sure it is ready.
*/

const resolver: Middleware = async (ctx) => {
	ctx.logger.info("Checking API status");
	if (mongoose.connection.readyState !== 1) {
		ctx.logger.error(
			`MongoDB ready state is ${mongoose.connection.readyState}`,
		);
		ctx.throw(
			HttpStatusCode.InternalServerError,
			"MongoDB connection is not ready",
		);
	}
	ctx.logger.info("MongoDB connection OK");

	if (!checkSyliusTokens(ctx)) {
		ctx.logger.error("One or more sylius token(s) are not valid");
		ctx.throw(HttpStatusCode.InternalServerError, "Sylius tokens are invalid");
	}
	ctx.logger.info("Sylius tokens OK");

	if (!(await checkSecretsManagerClient())) {
		ctx.logger.error("Secrets Manager Client is not ready");
		ctx.throw(HttpStatusCode.InternalServerError, "Secrets manager not ready");
	}
	ctx.logger.info("Secrets Manager client OK");

	ctx.logger.info("API status OK");
	ctx.status = HttpStatusCode.Ok;
};

export default resolver;
