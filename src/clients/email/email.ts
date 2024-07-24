import {
	SESv2Client,
	SendEmailCommand,
	type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";
import config from "@config";
import type { SendEmailConfig, TemplateData } from "@ts-types/email.t";
import type { IItems } from "@ts-types/order.t";
import getPrivacyPolicy from "@utils/get-privacy-policy";
import { getSyliusAPI } from "@utils/sylius-apis-configs";
import handlebars from "handlebars";
import { helpers } from "./email.helpers";
import { partials } from "./email.partials";
import { templates } from "./email.templates";

const getSESClient = () => {
	const client = new SESv2Client({ region: config.get("VITE_AWS_REGION") });
	return client;
};

for (const partial of Object.keys(partials)) {
	handlebars.registerPartial(partial, partials[partial]);
}

for (const helper of Object.keys(helpers)) {
	handlebars.registerHelper(helper, helpers[helper]);
}
export const TemplatesNames = Object.keys(templates);

const prepareTemplateData = (data: TemplateData): TemplateData => {
	const apiConfig = getSyliusAPI(data.brand);

	data.websiteURL = apiConfig.apiURL;
	data.emailLogo = `${apiConfig.apiURL}/assets/shop/img/email/email-logo-${data.brand}.png`;
	data.emailHero = `${apiConfig.apiURL}/assets/shop/img/email/email-${data.brand}.jpg`;
	data.privacyPolicyURL = getPrivacyPolicy(data.brand);

	const items: IItems[] = [];
	if (data.orderDetails) {
		for (const item of data.orderDetails.items) {
			if (Array.isArray(item)) {
				items.push(...item);
			} else {
				items.push(item);
			}
		}
	}

	for (const item of items) {
		if (item.image) {
			item.image = `${apiConfig.apiURL}/media/image/${item.image}`;
		}
	}

	data.orderDetails.items = items;
	return data;
};

export const executeTemplate = (name: string, data: TemplateData) => {
	return templates[name].template(prepareTemplateData(data));
};

const checkConfig = (c: SendEmailConfig) => {
	if (!TemplatesNames.find((k) => k === c.template.name)) {
		throw new Error(
			`Tried to send email with an unknown template, asked [${c.template.name}], known templates are [${TemplatesNames}]`,
		);
	}

	if (
		!c.template.data.orderDetails.customer.email ||
		c.template.data.orderDetails.customer.email === ""
	) {
		throw new Error("Can not send an email if we don't know who to");
	}
};

const send = async (
	subject: string,
	fromAddress: string,
	fromAddressARN: string,
	destination: string[],
	htmlBody: string,
) => {
	const client = getSESClient();
	const input: SendEmailCommandInput = {
		FromEmailAddress: fromAddress,
		FromEmailAddressIdentityArn: fromAddressARN,
		Destination: {
			ToAddresses: destination,
		},
		Content: {
			Simple: {
				Subject: {
					Data: subject,
				},
				Body: {
					Html: {
						Data: htmlBody,
					},
				},
			},
		},
	};

	const cmd = new SendEmailCommand(input);

	return await client.send(cmd);
};

export const sendPartner = async (c: SendEmailConfig) => {
	const htmlBody = executeTemplate(c.template.name, c.template.data);

	return await send(
		templates[c.template.name].subject,
		c.config.fromAddress,
		c.config.fromAddressARN,
		[c.template.data.referent.email],
		htmlBody,
	);
};

export const sendCustomer = async (c: SendEmailConfig) => {
	checkConfig(c);

	const htmlBody = executeTemplate(
		c.template.name,
		c.template.data as TemplateData,
	);

	return await send(
		templates[c.template.name].subject,
		c.config.fromAddress,
		c.config.fromAddressARN,
		[c.template.data.orderDetails.customer.email],
		htmlBody,
	);
};
