/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["ProgressiveWebAppStartMenuUtils"];

import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";

var { XPCOMUtils } = ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm');
const lazy = {};

XPCOMUtils.defineLazyModuleGetters(lazy, {
    FileUtils: 'resource://gre/modules/FileUtils.sys.mjs',
    PathUtils: 'resource://gre/modules/PathUtils.sys.mjs',
});


export let ProgressiveWebAppStartMenuUtils = {
    get browserInstallationDirectory() {
        return Services.dirsvc.get("GreD", Ci.nsIFile).path;
    },

    get desktopDirectory() {
        return Services.dirsvc.get("Desk", Ci.nsIFile).path;
    },

    get startMenuDirectory() {
        return Services.dirsvc.get("Home", Ci.nsIFile).path + "\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs";
    },

    get shellService() {
        return Cc["@mozilla.org/browser/shell-service;1"].getService(Ci.nsIWindowsShellService); 
    },

    async createShortCut(shortcutName, targetPath) {
        let shellService = this.shellService;
        let winTaskbar = Cc["@mozilla.org/windows-taskbar;1"].getService(
            Ci.nsIWinTaskbar
        );
        let appdir = Services.dirsvc.get("GreD", Ci.nsIFile);
        let exe = appdir.clone();
        const PRIVATE_BROWSING_BINARY = `${AppConstants.MOZ_APP_DISPLAYNAME_DO_NOT_USE.toLowerCase()}.exe`
        exe.append(PRIVATE_BROWSING_BINARY);

        if (!targetPath) {
            targetPath = this.startMenuDirectory;
        }

        await shellService.createShortcut(
            exe,
            [],
            "Floorp Progressive Web App for " + shortcutName,
            icon,
            0,
            winTaskbar.defaultPrivateGroupId,
            "Programs",
            "Floorp Progressive Web App.lnk",
            Services.dirsvc.get("GreD", Ci.nsIFile),
        );
    },
};
