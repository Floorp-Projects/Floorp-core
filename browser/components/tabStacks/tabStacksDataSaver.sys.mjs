/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["tabStacksDataSaver"];

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  tabStacksExternalFileService:
    "resource:///modules/tabStacksExternalFileService.sys.mjs",
});

export const tabStacksDataSaver = {
    get _tabStacksStoreFile() {
        return lazy.tabStacksExternalFileService._tabStacksStoreFile 
    },

    async saveTabStacksData(tabStacksData, windowId) {
        let json = await IOUtils.readJSON(this._tabStacksStoreFile);
        json.windows[windowId] = tabStacksData;

        await IOUtils.writeJSON(this._tabStacksStoreFile, json);
    },

    async saveTabStacksDataWithoutOverwritingPreferences(tabStacksData, windowId) {
        let json = await IOUtils.readJSON(this._tabStacksStoreFile);
        let preferences = json.windows[windowId].preferences;
        json.windows[windowId] = tabStacksData;
        json.windows[windowId].preferences = preferences;

        await IOUtils.writeJSON(this._tabStacksStoreFile, json);
    },

    async saveWindowPreferences(preferences, windowId) {
        let json = await IOUtils.readJSON(this._tabStacksStoreFile);
        json.windows[windowId].preferences = preferences;

        await IOUtils.writeJSON(this._tabStacksStoreFile, json);
    },
}
