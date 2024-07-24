import handlebars from "handlebars";
import { readFileSync } from "node:fs";
import path from "node:path";

interface TemplateConfig {
	template: HandlebarsTemplateDelegate<unknown>;
	subject: string;
}

export const templates: { [key: string]: TemplateConfig } = {
	"dealer-notification": {
		template: handlebars.compile(
			readFileSync(
				path.resolve("./src/clients/email/templates/dealer-notification.html"),
				"utf-8",
			),
		),
		subject: "Nouvelle commande d’accessoire en ligne à traiter",
	},
	confirmed: {
		template: handlebars.compile(
			readFileSync(
				path.resolve("./src/clients/email/templates/confirmed.html"),
				"utf-8",
			),
		),
		subject: "Votre commande est en cours de préparation",
	},
	fulfilled: {
		template: handlebars.compile(
			readFileSync(
				path.resolve("./src/clients/email/templates/fulfilled.html"),
				"utf-8",
			),
		),
		subject: "Votre commande est disponible !",
	},
	cancelled: {
		template: handlebars.compile(
			readFileSync(
				path.resolve("./src/clients/email/templates/cancelled.html"),
				"utf-8",
			),
		),
		subject: "Votre commande a bien été annulée",
	},
	approved: {
		template: handlebars.compile(
			readFileSync(
				path.resolve("./src/clients/email/templates/approved.html"),
				"utf-8",
			),
		),
		subject: "Confirmation de votre commande",
	},
};
