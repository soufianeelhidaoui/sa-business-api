import { configDefaults, defineConfig } from "vitest/config";
import tsconfig from "./tsconfig.json";

import path from "path";

const paths = tsconfig.compilerOptions.paths;

const logViteWarn = (message: string) => {
	console.warn(`vite.config: ${message}`);
};

const aliases = Object.keys(paths).reduce((acc, key) => {
	const currentPaths = paths[key];

	if (currentPaths.length > 1) {
		logViteWarn(
			"Mutiple paths wont be handled and may need to be added manually to your vite.config file",
		);
	}

	const [currentPath] = currentPaths;
	const sanatize = (str: string) => str.replace("/*", "");
	const sanatizedKey = sanatize(key);
	const sanatizedPath = sanatize(currentPath);

	if (acc[sanatizedKey]) {
		logViteWarn(
			`alias ${key}: ${currentPath} once sanatized already exist: ${sanatizedKey}: ${acc[sanatizedKey]}`,
		);
		return acc;
	}

	return {
		...acc,
		[sanatizedKey]: path.resolve(sanatizedPath),
	};
}, {});

export default defineConfig({
	resolve: {
		alias: aliases,
	},
	test: {
		exclude: [
			...configDefaults.exclude,
			"src/services/login/**",
			"src/clients/secrets/**",
		],
		reporters: ["verbose"],
		coverage: {
			reporter: ["cobertura", "html", "text"],
		},
		unstubEnvs: false,
		env: {
			VITE_AWS_REGION: "eu-west-3",
			VITE_BUSINESS_API_DISABLE_CACHE: "true",
			VITE_SMARTPAY_BASE_URL: "http://running.vitest.local",
			VITE_MONGOOSE_URL: "unit-testing-this-should-not-happen",
			VITE_SCHEDULER_FEATURE_FLAG: "true",
			VITE_SCHEDULER_MAX_CONCURRENT_JOB: "5",
		},
	},
});
