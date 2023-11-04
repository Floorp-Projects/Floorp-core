/* eslint-disable no-undef */
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
            
            // Add SSB Window or Tab Attribute
            // This attribute is used to make do not restore the window or tab when the browser is restarted.
            window.gBrowser.floorpSsbWindow = true;
            gBrowser.tabs.forEach(tab => {
              tab.setAttribute("floorpSSB", "true");
            });    
          }
          catch(e) {
            console.log(e);
          }
        }
    }
}

gSsbSupport.init();
