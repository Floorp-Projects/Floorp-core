/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["SiteSpecificBrowserExternalFileService"];

export const SiteSpecificBrowserExternalFileService = {
  get _saveFile() {
    return PathUtils.join(PathUtils.profileDir, "ssb.json");
  },

  async getCurrentSsbData() {
    let fileExists = await IOUtils.exists(this._saveFile);
    if (!fileExists) {
      IOUtils.writeJSON(this._saveFile, {});
      return {};
    }

    let result = await IOUtils.readJSON(this._saveFile);

    return result;
  },

  async saveSsbData(ssbData) {
    await IOUtils.writeJSON(this._saveFile, ssbData);
  },

  get _saveSsbMap() {
    return PathUtils.join(PathUtils.profileDir, "ssb-map.json");
  },

  async ssbMapFileExists() {
    let fileExists = await IOUtils.exists(this._saveSsbMap);
    return fileExists;
  },

  async getSsbMapData() {
    let fileExists = await IOUtils.exists(this._saveSsbMap);
    if (!fileExists) {
      IOUtils.writeJSON(this._saveSsbMap, {});
      return null;
    }

    let result = await IOUtils.readUTF8(this._saveSsbMap);

    return result;
  },

  async saveSsbMapData(ssbMapData) {
    await IOUtils.writeJSON(this._saveSsbMap, ssbMapData);
  },
};
