/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { SiteSpecificBrowserExternalFileService } = ChromeUtils.importESModule(
	"resource:///modules/SiteSpecificBrowserExternalFileService.sys.mjs",
);

var { SiteSpecificBrowser } = ChromeUtils.importESModule(
	"resource:///modules/SiteSpecificBrowserService.sys.mjs",
);

var { SiteSpecificBrowserIdUtils } = ChromeUtils.importESModule(
	"resource:///modules/SiteSpecificBrowserIdUtils.sys.mjs",
);

const gSsbChromeManager = {
	_initialized: false,

	init() {
		if (this._initialized) {
			return;
		}

		document.addEventListener("floorpOnLocationChangeEvent", () => {
			gSsbChromeManager.eventListeners.onCurrentTabChangedOrLoaded();
		});

		// This is needed to handle the case when the user opens a new tab in the same window.
		window.setTimeout(() => {
			gSsbChromeManager.eventListeners.onCurrentTabChangedOrLoaded();
		}, 1000);

		this._initialized = true;
	},

	functions: {
		async installOrRunCurrentPageAsSsb(asPwa) {
			const isInstalled =
				await gSsbChromeManager.functions.checkCurrentPageIsInstalled();

			if (!gBrowser.currentURI.schemeIs("https")) {
				return;
			}

			if (isInstalled) {
				const currentTabSsb =
					await gSsbChromeManager.functions.getCurrentTabSsb();
				const ssbObj = await SiteSpecificBrowserIdUtils.getIdByUrl(
					currentTabSsb._manifest.start_url,
				);

				if (ssbObj) {
					const id = ssbObj.id;
					await SiteSpecificBrowserIdUtils.runSsbByUrlAndId(
						gBrowser.currentURI.spec,
						id,
					);

					// The site's manifest may point to a different start page so explicitly
					// open the SSB to the current page.
					gBrowser.removeTab(gBrowser.selectedTab, {
						closeWindowWithLastTab: false,
					});
					gFloorpPageAction.Ssb.closePopup();
				}
			} else {
				const ssb = await SiteSpecificBrowser.createFromBrowser(
					gBrowser.selectedBrowser,
					{
						// Configure the SSB to use the site's manifest if it exists.
						useWebManifest: asPwa,
					},
				);

				await ssb.install();

				// Installing needs some time to finish. So we wait 4 seconds before
				window.setTimeout(() => {
					SiteSpecificBrowserIdUtils.runSsbById(ssb.id);

					// The site's manifest may point to a different start page so explicitly
					// open the SSB to the current page.
					gBrowser.removeTab(gBrowser.selectedTab, {
						closeWindowWithLastTab: false,
					});

					gFloorpPageAction.Ssb.closePopup();
				}, 3000);
			}
		},

		async checkCurrentPageCanBeInstalled() {
			const currentURI = gBrowser.currentURI;
			const currentTab = gBrowser.selectedTab;
			const currentTabURL = currentTab.linkedBrowser.currentURI.spec;

			if (
				currentTabURL.startsWith("https://") ||
				currentTabURL.startsWith("file://") ||
				currentURI.asciiHost === "localhost"
			) {
				return true;
			}

			return false;
		},

		async checkCurrentPageHasSsbManifest() {
			if (
				gBrowser.currentURI.schemeIs("about") ||
				gBrowser.currentURI.schemeIs("chrome") ||
				gBrowser.currentURI.schemeIs("resource") ||
				gBrowser.currentURI.schemeIs("view-source") ||
				gBrowser.currentURI.schemeIs("moz-extension") ||
				// Exlude "about:blank"
				gBrowser.currentURI.spec === "about:blank"
			) {
				return null;
			}

			const actor =
				gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor(
					"SiteSpecificBrowser",
				);
			// If true, return the manifest href, otherwise return null
			const result = await actor.sendQuery("checkSsbManifestIsExistent");

			return result;
		},

		async checkCurrentPageIsInstalled() {
			if (
				gBrowser.currentURI.schemeIs("about") ||
				gBrowser.currentURI.schemeIs("chrome") ||
				gBrowser.currentURI.schemeIs("resource") ||
				gBrowser.currentURI.schemeIs("view-source") ||
				gBrowser.currentURI.schemeIs("moz-extension") ||
				// Exlude "about:blank"
				gBrowser.currentURI.spec === "about:blank"
			) {
				return false;
			}

			const currentTabSsb = await gSsbChromeManager.functions.getCurrentTabSsb();
			const ssbData =
				await SiteSpecificBrowserExternalFileService.getCurrentSsbData();

			for (const key in ssbData) {
				if (
					key === currentTabSsb._manifest.start_url ||
					currentTabSsb._manifest.start_url.startsWith(key)
				) {
					return true;
				}
			}
			return false;
		},

		enableInstallButton(openSsb) {
			const installButton = document.getElementById("ssbPageAction");
			installButton.removeAttribute("hidden");

			const image = document.getElementById("ssbPageAction-image");
			if (openSsb) {
				image.setAttribute("open-ssb", "true");
			} else {
				image.removeAttribute("open-ssb");
			}
		},

		disableInstallButton() {
			const installButton = document.getElementById("ssbPageAction");
			installButton.setAttribute("hidden", true);
		},

		async getCurrentTabSsb() {
			const options = {
				useWebManifest: true,
			};

			const currentURISsbObj = await SiteSpecificBrowser.createFromBrowser(
				gBrowser.selectedBrowser,
				options,
			);

			return currentURISsbObj;
		},

		async setImageToInstallButton() {
			gBrowser.currentURI;

			const currentURISsbObj = await this.getCurrentTabSsb();
			const isInstalled = await this.checkCurrentPageIsInstalled();

			const currentTabTitle = currentURISsbObj.name;
			const currentTabIcon = currentURISsbObj._manifest.icons[0]?.src;
			const currentTabURL = currentURISsbObj._scope.displayHost;

			const ssbContentLabel = document.getElementById("ssb-content-label");
			const ssbContentDescription = document.getElementById(
				"ssb-content-description",
			);
			const ssbContentIcon = document.getElementById("ssb-content-icon");
			const installButton = document.querySelector("#ssb-app-install-button");

			if (ssbContentLabel) {
				ssbContentLabel.textContent = currentTabTitle;
			}

			if (ssbContentDescription) {
				ssbContentDescription.textContent = currentTabURL;
			}

			if (installButton) {
				if (isInstalled) {
					document.l10n.setAttributes(installButton, "ssb-app-open-button");
					installButton.setAttribute("open-ssb", "true");
				} else {
					document.l10n.setAttributes(installButton, "ssb-app-install-button");
					installButton.removeAttribute("open-ssb");
				}
			}

			if (ssbContentIcon) {
				ssbContentIcon.src = currentTabIcon;
			}
		},

		async onSsbSubViewOpened() {
			// Update ssb infomation
			const parentElem = document.getElementById("panelMenu_installedSsbMenu");
			const list =
				await SiteSpecificBrowserExternalFileService.getCurrentSsbData();

			// remove old ssb infomation
			const ssbAppInfoButtons = document.querySelectorAll(".ssb-app-info-button");
			for (const ssbAppInfoButton of ssbAppInfoButtons) {
				ssbAppInfoButton.remove();
			}

			for (const key in list) {
				const id = list[key].id;
				const name = list[key].name;
				const icon = list[key].manifest.icons[0].src;

				const elem = window.MozXULElement.parseXULToFragment(`
          <toolbarbutton id="ssb-${id}" class="subviewbutton ssb-app-info-button" label="${name}" image="${icon}"
                         ssbId="${id}" oncommand="SiteSpecificBrowserIdUtils.runSsbById('${id}');"/>
        `);

				parentElem?.appendChild(elem);
			}

			// Check current page ssb is installed
			const currentPageCanBeInstalled =
				await gSsbChromeManager.functions.checkCurrentPageCanBeInstalled();
			const installButtonOnPanelUI = document.getElementById(
				"appMenu-install-or-open-ssb-current-page-button",
			);

			if (currentPageCanBeInstalled === false) {
				installButtonOnPanelUI.setAttribute("disabled", "true");
				document.l10n.setAttributes(
					installButtonOnPanelUI,
					"appmenuitem-install-current-page",
				);
				installButtonOnPanelUI.removeAttribute("open-ssb");
			} else {
				const isInstalled =
					await gSsbChromeManager.functions.checkCurrentPageIsInstalled();
				installButtonOnPanelUI.removeAttribute("disabled");
				if (isInstalled) {
					document.l10n.setAttributes(
						installButtonOnPanelUI,
						"appmenuitem-open-current-page",
					);
					installButtonOnPanelUI.setAttribute("open-ssb", "true");
				} else {
					document.l10n.setAttributes(
						installButtonOnPanelUI,
						"appmenuitem-install-current-page",
					);
					installButtonOnPanelUI.removeAttribute("open-ssb");
				}
			}
		},

		async showSsbPanelSubView() {
			await PanelUI.showSubView(
				"PanelUI-ssb",
				document.getElementById("appMenu-ssb-button"),
			);
			this.onSsbSubViewOpened();
		},
	},

	contextMenu: {
		panelUIInstalledAppContextMenu: {
			onPopupShowing(e) {
				// Create context menu
				const oldMenuItems = document.querySelectorAll(".ssb-contextmenu-items");

				for (let i = 0; i < oldMenuItems.length; i++) {
					oldMenuItems[i].remove();
				}

				const menuitemElem = window.MozXULElement.parseXULToFragment(`
          <menuitem id="run-ssb-contextmenu" class="ssb-contextmenu-items" data-l10n-id="appmenuitem-contextmenu-open-app" oncommand="gSsbChromeManager.contextMenu.panelUIInstalledAppContextMenu.openSsbApp('${e.explicitOriginalTarget.getAttribute(
						"ssbId",
					)}');"/>

          <menuitem id="uninstall-ssb-contextmenu" class="ssb-contextmenu-items" data-l10n-id="appmenuitem-contextmenu-uninstall-app" oncommand="gSsbChromeManager.contextMenu.panelUIInstalledAppContextMenu.uninstallSsbApp('${e.explicitOriginalTarget.getAttribute(
						"ssbId",
					)}');"/>
        `);

				document
					.getElementById("ssbInstalledAppMenu-context")
					.appendChild(menuitemElem);
			},
			openSsbApp(id) {
				// id is Ssb id
				SiteSpecificBrowserIdUtils.runSsbById(id);
			},
			uninstallSsbApp(id) {
				document.querySelector(`[ssbId="${id}"]`).hidden = true;
				// id is Ssb id
				SiteSpecificBrowserIdUtils.uninstallById(id);
			},
		},
	},

	eventListeners: {
		async onCurrentTabChangedOrLoaded() {
			// set image to the install button
			const currentPageCanBeInstalled =
				await gSsbChromeManager.functions.checkCurrentPageCanBeInstalled();
			const currentPageHasSsbManifest =
				await gSsbChromeManager.functions.checkCurrentPageHasSsbManifest();
			const currentPageIsInstalled =
				await gSsbChromeManager.functions.checkCurrentPageIsInstalled();

			if (
				(!currentPageCanBeInstalled || currentPageHasSsbManifest === null) &&
				!currentPageIsInstalled
			) {
				gSsbChromeManager.functions.disableInstallButton();
				return;
			}

			gSsbChromeManager.functions.setImageToInstallButton();

			window.setTimeout(() => {
				gSsbChromeManager.functions.enableInstallButton(currentPageIsInstalled);
			}, 100);
		},
	},
};

if (Services.prefs.getBoolPref("browser.ssb.enabled")) {
	gSsbChromeManager.init();
} else {
	// Hide XUL elements
	const css = `
    #ssbPageAction,
    #appMenu-ssb-button,
    #appMenu-install-or-open-ssb-current-page-button,
    #appMenu-ssb-button {
      display: none !important;
    }
  `;
	const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
		Ci.nsIStyleSheetService,
	);
	const uri = makeURI("data:text/css," + encodeURIComponent(css));
	sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
}
