/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { SiteSpecificBrowserExternalFileService } = ChromeUtils.importESModule(
  "resource:///modules/SiteSpecificBrowserExternalFileService.sys.mjs"
);

var { SiteSpecificBrowser } = ChromeUtils.importESModule(
  "resource:///modules/SiteSpecificBrowserService.sys.mjs"
);

var { SiteSpecificBrowserIdUtils } = ChromeUtils.importESModule(
  "resource:///modules/SiteSpecificBrowserIdUtils.sys.mjs"
);

const gSsbChromeManager = {
  _initialized: false,

  init() {
    if (this._initialized) {
      return;
    }

    // Use internal APIs to detect when the current tab changes.

    let events = ["TabSelect"];

    for (let event of events) {
      gBrowser.tabContainer.addEventListener(
        event,
        this.eventListeners.onCurrentTabChangedOrLoaded
      );
    }

    let count = 0;
    let currentURL = gBrowser.currentURI.spec;

    function checkURLChange() {
      const newURL = gBrowser.currentURI.spec;    
      if (newURL !== currentURL || count < 2) {
        gSsbChromeManager.eventListeners.onCurrentTabChangedOrLoaded();
        currentURL = newURL;
        // try 2 times
        if (newURL !== currentURL) {
          count = 0;
        }
        count++;
      }
    }

    // Use internal APIs to detect when the current tab changes.
    setInterval(checkURLChange, 2000);

    // This is needed to handle the case when the user opens a new tab in the same window.
    window.setTimeout(() => {
      gSsbChromeManager.eventListeners.onCurrentTabChangedOrLoaded();
    }, 1000);

    this._initialized = true;
  },

  functions: {
    async installOrRunCurrentPageAsSsb(asPwa) {
      let isInstalled =
        await gSsbChromeManager.functions.checkCurrentPageIsInstalled();

      if (!gBrowser.currentURI.schemeIs("https")) {
        return;
      }

      if (isInstalled) {
        let currentTabSsb =
          await gSsbChromeManager.functions.getCurrentTabSsb();
        let ssbObj = await SiteSpecificBrowserIdUtils.getIdByUrl(
          currentTabSsb._manifest.start_url
        );

        if (ssbObj) {
          let id = ssbObj.id;
          await SiteSpecificBrowserIdUtils.runSsbByUrlAndId(gBrowser.currentURI.spec, id);
          gFloorpPageAction.Ssb.closePopup();
        }
      } else {
        let ssb = await SiteSpecificBrowser.createFromBrowser(
          gBrowser.selectedBrowser,
          {
            // Configure the SSB to use the site's manifest if it exists.
            useWebManifest: asPwa,
          }
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
      let currentURI = gBrowser.currentURI;
      let currentTab = gBrowser.selectedTab;
      let currentTabURL = currentTab.linkedBrowser.currentURI.spec;

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

      let actor =
        gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor(
          "SiteSpecificBrowser"
        );
      // If true, return the manifest href, otherwise return null
      let result = await actor.sendQuery("checkSsbManifestIsExistent");

      return result;
    },

    async checkCurrentPageIsInstalled() {
      let currentTabSsb = await this.getCurrentTabSsb();
      let ssbData =
        await SiteSpecificBrowserExternalFileService.getCurrentSsbData();

      for (let key in ssbData) {
        if (key === currentTabSsb._manifest.start_url) {
          return true;
        }
      }
      return false;
    },

    enableInstallButton() {
      let installButton = document.getElementById("ssbPageAction");
      installButton.removeAttribute("hidden");
    },

    disableInstallButton() {
      let installButton = document.getElementById("ssbPageAction");
      installButton.setAttribute("hidden", true);
    },

    async getCurrentTabSsb() {
      let options = {
        useWebManifest: true,
      };

      let currentURISsbObj = await SiteSpecificBrowser.createFromBrowser(
        gBrowser.selectedBrowser,
        options
      );

      return currentURISsbObj;
    },

    async setImageToInstallButton() {
      gBrowser.currentURI;

      let currentURISsbObj = await this.getCurrentTabSsb();
      let isInstalled = await this.checkCurrentPageIsInstalled();

      let currentTabTitle = currentURISsbObj.name;
      let currentTabIcon = currentURISsbObj._manifest.icons[0].src 
      let currentTabURL = currentURISsbObj._scope.displayHost;

      let ssbContentLabel = document.getElementById("ssb-content-label");
      let ssbContentDescription = document.getElementById(
        "ssb-content-description"
      );
      let ssbContentIcon = document.getElementById("ssb-content-icon");

      let installButton = document.querySelector("#ssb-app-install-button");

      if (ssbContentLabel) {
        ssbContentLabel.textContent = currentTabTitle;
      }

      if (ssbContentDescription) {
        ssbContentDescription.textContent = currentTabURL;
      }

      if (installButton) {
        if (isInstalled) {
          document.l10n.setAttributes(installButton, "ssb-app-open-button");
        } else {
          document.l10n.setAttributes(installButton, "ssb-app-install-button");
        }
      }

      if (ssbContentIcon) {
        ssbContentIcon.src = currentTabIcon;
      }
    },

    async onSsbSubViewOpened() {
      // Update ssb infomation
      let parentElem = document.getElementById("panelMenu_installedSsbMenu");
      let list =
        await SiteSpecificBrowserExternalFileService.getCurrentSsbData();

      // remove old ssb infomation
      let ssbAppInfoButtons = document.querySelectorAll(".ssb-app-info-button");
      for (let ssbAppInfoButton of ssbAppInfoButtons) {
        ssbAppInfoButton.remove();
      }

      for (let key in list) {
        let id = list[key].id;
        let name = list[key].name;
        let icon = list[key].icon;

        let elem = window.MozXULElement.parseXULToFragment(`
          <toolbarbutton id="ssb-${id}" class="subviewbutton ssb-app-info-button" label="${name}" image="${icon}"
                         ssbId="${id}" oncommand="SiteSpecificBrowserIdUtils.runSsbById('${id}');"/>
        `);

        parentElem?.appendChild(elem);
      }

      // Check current page ssb is installed
      let currentPageCanBeInstalled =
       await gSsbChromeManager.functions.checkCurrentPageCanBeInstalled();
      let installButtonOnPanelUI = document.getElementById("appmenu-install-current-page-button");

      if (!currentPageCanBeInstalled) {
        installButtonOnPanelUI.setAttribute("disabled", true);
        document.l10n.setAttributes(installButtonOnPanelUI, "appmenuitem-install-current-page");
      } else {
        installButtonOnPanelUI.removeAttribute("disabled");
        let isInstalled =
          await gSsbChromeManager.functions.checkCurrentPageIsInstalled();
        if (isInstalled) {
          document.l10n.setAttributes(installButtonOnPanelUI, "appmenuitem-open-current-page");
        }
      }
    },

    async showSsbPanelSubView() {
      await PanelUI.showSubView(
        "PanelUI-ssb",
        document.getElementById("appMenu-ssb-button")
      );
      this.onSsbSubViewOpened();
    },
  },

  contextMenu: {
    panelUIInstalledAppContextMenu: {
      onPopupShowing(e) {
        // Create context menu
        let oldMenuItems = document.querySelectorAll(".ssb-contextmenu-items");

        for (let i = 0; i < oldMenuItems.length; i++) {
          oldMenuItems[i].remove();
        }
  
        let menuitemElem = window.MozXULElement.parseXULToFragment(`
          <menuitem id="run-ssb-contextmenu" class="ssb-contextmenu-items" data-l10n-id="appmenuitem-contextmenu-open-app" oncommand="gSsbChromeManager.contextMenu.panelUIInstalledAppContextMenu.openSsbApp('${e.explicitOriginalTarget.getAttribute(
            "ssbId"
          )}');"/>

          <menuitem id="uninstall-ssb-contextmenu" class="ssb-contextmenu-items" data-l10n-id="appmenuitem-contextmenu-uninstall-app" oncommand="gSsbChromeManager.contextMenu.panelUIInstalledAppContextMenu.uninstallSsbApp('${e.explicitOriginalTarget.getAttribute(
            "ssbId"
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
      }
    },
  },

  eventListeners: {
    async onCurrentTabChangedOrLoaded() {
      // set image to the install button
      let currentPageCanBeInstalled =
        await gSsbChromeManager.functions.checkCurrentPageCanBeInstalled();
      let currentPageHasSsbManifest =
        await gSsbChromeManager.functions.checkCurrentPageHasSsbManifest();

      if (!currentPageCanBeInstalled || currentPageHasSsbManifest === null) {
        gSsbChromeManager.functions.disableInstallButton();
        return;
      }

      gSsbChromeManager.functions.setImageToInstallButton();

      window.setTimeout(() => {
        gSsbChromeManager.functions.enableInstallButton();
      }, 100);
    },
  },
};

if (Services.prefs.getBoolPref("browser.ssb.enabled")) {
  gSsbChromeManager.init();
} else {
  // Hide XUL elements
  let css = `
    #ssbPageAction,
    #appMenu-ssb-button,
    #appmenu-install-current-page-button,
    #appMenu-ssb-button {
      display: none !important;
    }
  `;
  let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
    Ci.nsIStyleSheetService
  );
  let uri = makeURI("data:text/css," + encodeURIComponent(css));
  sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
}
