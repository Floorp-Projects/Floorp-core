/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


const { SiteSpecificBrowserIdUtils } = ChromeUtils.import("resource:///modules/SiteSpecificBrowserIdUtils.jsm");

let gSsbSupport = {
    init() {
        let needSsbOpenWindow = Services.prefs.prefHasUserValue("browser.ssb.startup");
    
        if (needSsbOpenWindow) {
          try {
            SiteSpecificBrowserIdUtils.runSSBWithId(Services.prefs.getStringPref("browser.ssb.startup"));
            Services.prefs.clearUserPref("browser.ssb.startup");
          }
          catch(e) {
            console.log(e);
          }
        }
    }
}

gSsbSupport.init();
