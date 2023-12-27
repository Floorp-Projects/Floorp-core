import { processAll4Test } from "./src/index.js";

function main() {
	processAll4Test(
		"../nyanrus_Floorp",
		[
			"xpcom",
			"netwerk",
			"dom/interfaces/security",
			"dom/base",
			"dom/interfaces/base",
			"uriloader",
			"services",
			"widget",
			"image",
			"layout",
			"js",
			"toolkit",
			"caps",
		],
		"./dist",
	);
}

main();
