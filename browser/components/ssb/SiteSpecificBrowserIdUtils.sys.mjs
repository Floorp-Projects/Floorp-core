/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";

export const EXPORTED_SYMBOLS = ["SiteSpecificBrowserIdUtils"];

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { XPCOMUtils } = ChromeUtils.import(
  "resource://gre/modules/XPCOMUtils.jsm"
);

const lazy = {};
if (AppConstants.platform == "win") {
  XPCOMUtils.defineLazyModuleGetters(lazy, {
    SiteSpecificBrowser: "resource:///modules/SiteSpecificBrowserService.jsm",
    WindowsSupport: "resource:///modules/ssb/WindowsSupport.jsm",
  });
}

export let SiteSpecificBrowserIdUtils = {
  async runSSBWithId(id) {
    let ssb = await lazy.SiteSpecificBrowser.load(id);
    if (!ssb) {
      return;
    }

    this.createSsbWidow(ssb);
  },

  createSsbWidow(ssb) {
    if (ssb) {
      let browserWindowFeatures =
        "chrome,location=yes,centerscreen,dialog=no,resizable=yes,scrollbars=yes";
      //"chrome,location=yes,centerscreen,dialog=no,resizable=yes,scrollbars=yes";

      let args = Cc["@mozilla.org/supports-string;1"].createInstance(
        Ci.nsISupportsString
      );

      // URL
      args.data = `${ssb._scope.spec},${ssb._id},?FloorpEnableSSBWindow=true`;

      let win = Services.ww.openWindow(
        null,
        AppConstants.BROWSER_CHROME_URL,
        "_blank",
        browserWindowFeatures,
        args
      );

      if (Services.appinfo.OS == "WINNT") {
        lazy.WindowsSupport.applyOSIntegration(ssb, win);
      }
    }
  },

  async getIconBySSBId(id, size) {
    let ssb = await lazy.SiteSpecificBrowser.load(id);

    if (!ssb._iconSizes) {
      ssb._iconSizes = this.buildIconList(ssb._manifest.icons);
    }

    if (!ssb._iconSizes.length) {
      return null;
    }

    let i = 0;
    while (i < ssb._iconSizes.length && ssb._iconSizes[i].size < size) {
      i++;
    }

    return i < ssb._iconSizes.length
      ? ssb._iconSizes[i].icon
      : ssb._iconSizes[ssb._iconSizes.length - 1].icon;
  },

  buildIconList(icons) {
    let iconList = [];

    for (let icon of icons) {
      for (let sizeSpec of icon.sizes) {
        let size =
          sizeSpec == "any" ? Number.MAX_SAFE_INTEGER : parseInt(sizeSpec);

        iconList.push({
          icon,
          size,
        });
      }
    }

    iconList.sort((a, b) => {
      // Given that we're using MAX_SAFE_INTEGER adding a value to that would
      // overflow and give odd behaviour. And we're using numbers supplied by a
      // website so just compare for safety.
      if (a.size < b.size) {
        return -1;
      }

      if (a.size > b.size) {
        return 1;
      }

      return 0;
    });
    return iconList;
  },

  async getIdByUrl(uri) {
    const { SiteSpecificBrowserExternalFileService } = ChromeUtils.import(
      "resource:///modules/SiteSpecificBrowserExternalFileService.jsm"
    );
    let ssbData =
      await SiteSpecificBrowserExternalFileService.getCurrentSsbData();

    // check start with url
    for (let key in ssbData) {
      if (key == uri) {
        return ssbData[key];
      }
    }
    return null;
  },
};
