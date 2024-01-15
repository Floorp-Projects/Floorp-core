/* eslint-disable no-undef */

const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
	Ci.nsIStyleSheetService,
);
const ios = Services.io;

const sheetsMap = new WeakMap();

this.stylesheet = class extends ExtensionAPI {
	onShutdown(reason) {
		const { extension } = this;
		for (const sheet of sheetsMap.get(extension)) {
			const uriObj = ios.newURI(sheet.uri);
			sss.unregisterSheet(uriObj, sss[sheet.type]);
		}
		sheetsMap.delete(extension);
	}

	getAPI(context) {
		const { extension } = context;
		if (!sheetsMap.has(extension)) {
			sheetsMap.set(extension, []);
		}
		const loadedSheets = sheetsMap.get(extension);
		return {
			stylesheet: {
				async load(uri, type) {
					const uriObj = ios.newURI(uri);
					if (!sss.sheetRegistered(uriObj, sss[type])) {
						sss.loadAndRegisterSheet(uriObj, sss[type]);
						loadedSheets.push({ uri, type });
					}
				},
				async unload(uri, type) {
					const uriObj = ios.newURI(uri);
					if (sss.sheetRegistered(uriObj, sss[type])) {
						sss.unregisterSheet(uriObj, sss[type]);
						const index = loadedSheets.findIndex(
							(s) => s.uri == uri && s.type == type,
						);
						loadedSheets.splice(index, 1);
					}
				},
				async isLoaded(uri, type) {
					const uriObj = ios.newURI(uri);
					return sss.sheetRegistered(uriObj, sss[type]);
				},
			},
		};
	}
};
