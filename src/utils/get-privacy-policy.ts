const getPrivacyPolicy = (brand: string): string =>
	mapBrandToPrivacyPolicy[brand];

const mapBrandToPrivacyPolicy: { [key: string]: string } = {
	skoda:
		"https://www.skoda.fr/informations/politique-de-confidentialite?_gl=1*1mqpfd6*_gcl_au*OTk2NjU4OTQ1LjE3MTc1MTUwMjk.",
	cupra: "https://www.cupraofficial.fr/politique-confidentialite",
	seat: "https://www.seat.fr/entreprise/politique-de-confidentialite",
	vw: "https://www.volkswagen.fr/fr/footer/politique-de-confidentialite.html",
	vwu: "https://www.volkswagen-utilitaires.fr/fr/vw/politique-de-confidentialite.html",
};

export default getPrivacyPolicy;
