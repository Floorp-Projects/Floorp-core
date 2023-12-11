/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 export const EXPORTED_SYMBOLS = [
    "tabStacksWindowIdUtils"
];

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  tabStacksExternalFileService:
    "resource:///modules/tabStacksExternalFileService.sys.mjs",
});

export const tabStacksWindowIdUtils = {
    get _tabStacksStoreFile() {
        return lazy.tabStacksExternalFileService._tabStacksStoreFile 
    },

    async getAllWindowAndTabStacksData() {
        let fileExists = await IOUtils.exists(this._tabStacksStoreFile);
        if (!fileExists) {
            IOUtils.writeJSON(this._tabStacksStoreFile, {});
            return {};
        }

        let json = await IOUtils.readJSON(this._tabStacksStoreFile);
        return json;
    },
    
    async getWindowTabStacksData(windowId) {
        let fileExists = await IOUtils.exists(this._tabStacksStoreFile);
        if (!fileExists) {
            let obj = {
                windows: {}
            };

            IOUtils.writeJSON(this._tabStacksStoreFile, obj);
            return obj;
        }
    
        let json = await IOUtils.readJSON(this._tabStacksStoreFile);
        let result = json.windows[windowId] || {};
        return result;
    },

    async getWindowTabStacksDataWithoutPreferences(windowId) {
        let tabStacksData = await this.getWindowTabStacksData(windowId);
        delete tabStacksData.preferences;
        return tabStacksData;
    },

    async getDefaultTabStackId(windowId) {
        let tabStacksData = await this.getWindowTabStacksData(windowId);
        for (let tabStackId in tabStacksData) {
            let tabStack = tabStacksData[tabStackId];
            if (tabStack.defaultTabStack) {
                return tabStackId;
            }
        }
        return null;
    },

    async getSelectedTabStackId(windowId) {
        let tabStacksData = await this.getWindowTabStacksData(windowId);
        let preferences = tabStacksData.preferences || {};
        if (preferences.selectedTabStackId) {
            return preferences.selectedTabStackId;
        }

        let defaultTabStackId = await this.getDefaultTabStackId(windowId);
        if (defaultTabStackId) {
            return defaultTabStackId;
        }

        return null;
    },
}
