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

const gSsbInstallSupport = {
  _initialized: false,

  init() {
    if (this._initialized) {
      return;
    }

    // Use internal APIs to detect when the current tab changes.
    setInterval(this.eventListeners.onCurrentTabChangedOrLoaded, 2000);

    let events = ["TabSelect"];

    for (let event of events) {
      gBrowser.tabContainer.addEventListener(
        event,
        this.eventListeners.onCurrentTabChangedOrLoaded
      );
    }

    // This is needed to handle the case when the user opens a new tab in the same window.
    window.setTimeout(() => {
      this.eventListeners.onCurrentTabChangedOrLoaded();
    }, 1000);

    this._initialized = true;
  },

  functions: {
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
      let currentURISsbObj = await SiteSpecificBrowser.createFromBrowser(
        gBrowser.selectedBrowser
      );

      return currentURISsbObj;
    },

    async setImageToInstallButton() {
      gBrowser.currentURI;

      let currentURISsbObj = await this.getCurrentTabSsb();
      let isInstalled = await this.checkCurrentPageIsInstalled();

      let currentTabTitle = currentURISsbObj.name;
      let currentTabURL = currentURISsbObj._scope.displayHost;

      let ssbContentLabel = document.getElementById("ssb-content-label");
      let ssbContentDescription = document.getElementById(
        "ssb-content-description"
      );
      let ssbContentIcon = document.getElementById("ssb-content-icon");

      let installButton = document.querySelector(".ssb-app-install-button");

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
        ssbContentIcon.src = document.querySelector(
          ".tab-icon-image[selected=true]"
        ).src;
      }
    },
  },

  eventListeners: {
    async onCurrentTabChangedOrLoaded() {
      // set image to the install button
      let currentPageCanBeInstalled =
        await gSsbInstallSupport.functions.checkCurrentPageCanBeInstalled();
      let currentPageHasSsbManifest =
        await gSsbInstallSupport.functions.checkCurrentPageHasSsbManifest();

      if (!currentPageCanBeInstalled || currentPageHasSsbManifest === null) {
        gSsbInstallSupport.functions.disableInstallButton();
        return;
      }

      gSsbInstallSupport.functions.setImageToInstallButton();

      window.setTimeout(() => {
        gSsbInstallSupport.functions.enableInstallButton();
      }, 100);
    },
  },
};

if (Services.prefs.getBoolPref("browser.ssb.enabled")) {
    gSsbInstallSupport.init();
}
