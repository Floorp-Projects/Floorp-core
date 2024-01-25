/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  WorkspacesExternalFileService:
    "resource://floorp/modules/WorkspacesExternalFileService.sys.mjs",
});

export const WorkspacesDataSaver = {
  get _workspacesStoreFile() {
    return lazy.WorkspacesExternalFileService._workspacesStoreFile;
  },

  async saveWorkspacesData(workspacesData, windowId) {
    let json = await IOUtils.readJSON(this._workspacesStoreFile);
    json.windows[windowId] = workspacesData;

    await IOUtils.writeJSON(this._workspacesStoreFile, json);
  },

  async saveWorkspaceData(workspaceData, windowId) {
    let json = await IOUtils.readJSON(this._workspacesStoreFile);
    json.windows[windowId].workspaces[workspaceData.id] = workspaceData;

    await IOUtils.writeJSON(this._workspacesStoreFile, json);
  },

  async saveWorkspacesDataWithoutOverwritingPreferences(
    workspacesData,
    windowId
  ) {
    let json = await IOUtils.readJSON(this._workspacesStoreFile);
    let preferences = json.windows[windowId].preferences;
    json.windows[windowId] = workspacesData;
    json.windows[windowId].preferences = preferences;

    await IOUtils.writeJSON(this._workspacesStoreFile, json);
  },

  async saveWindowPreferences(preferences, windowId) {
    let json = await IOUtils.readJSON(this._workspacesStoreFile);
    json.windows[windowId].preferences = preferences;

    await IOUtils.writeJSON(this._workspacesStoreFile, json);
  },
};
