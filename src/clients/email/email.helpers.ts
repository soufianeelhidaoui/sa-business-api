import type { HelperDelegate } from "handlebars";

export const formatPrice = (price: number): string => {
	return (price / 100).toLocaleString("fr-FR", {
		minimumIntegerDigits: 2,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		useGrouping: false,
	});
};

export const upperCase = (value: string): string => {
	return value.toUpperCase();
};

export const helpers: { [name: string]: HelperDelegate } = {
	formatPrice: formatPrice,
	upperCase: upperCase,
};
