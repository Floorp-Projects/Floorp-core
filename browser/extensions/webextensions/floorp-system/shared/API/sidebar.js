/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/* global ExtensionAPI, ExtensionCommon, Services, XPCOMUtils */

this.sidebar = class extends ExtensionAPI {
	getAPI(context) {
		return {
			sidebar: {
				async getExtensionsInSidebar() {
					const extensionsMap =
						Services.wm.getMostRecentWindow("navigator:browser").SidebarUI
							?.sidebars;
					const extensionsArr = [];
					for (const e of extensionsMap.values()) {
						if (!("sourceL10nEl" in e))
							extensionsArr.push({
								title: e.title,
								id: e.extensionId,
								buttonId: e.buttonId,
							});
					}
					return extensionsArr;
				},
			},
		};
	}
};
