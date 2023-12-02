/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["tabStacksExternalFileService"];

export const tabStacksExternalFileService = {
    get _tabStacksStoreFile() {
        return PathUtils.join(PathUtils.profileDir, "tabstacks", "tabstacks.json");
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
    
    async saveTabStacksData(tabStacksData, windowId) {
        let json = await IOUtils.readJSON(this._tabStacksStoreFile);
        json.windows[windowId] = tabStacksData;

        await IOUtils.writeJSON(this._tabStacksStoreFile, json);
    },
}
