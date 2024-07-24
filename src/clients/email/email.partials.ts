import { readFileSync } from "fs";
import type { Template } from "handlebars";
import path from "node:path";

const dealerMap = readFileSync(
	path.resolve("./src/clients/email/templates/partials/_map.html"),
	"utf-8",
);

const footer = readFileSync(
	path.resolve("./src/clients/email/templates/partials/_footer.html"),
	"utf-8",
);

const headBand = readFileSync(
	path.resolve("./src/clients/email/templates/partials/_headband.html"),
	"utf-8",
);

const articles = readFileSync(
	path.resolve("./src/clients/email/templates/partials/_articles.html"),
	"utf-8",
);

export const partials: { [name: string]: Template<unknown> } = {
	dealerMap: dealerMap,
	footer: footer,
	headBand: headBand,
	articles: articles,
};
