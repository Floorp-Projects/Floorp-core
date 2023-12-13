/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = [
    "workspacesIdUtils"
];

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  workspacesExternalFileService:
    "resource:///modules/workspacesExternalFileService.sys.mjs",
  workspacesWindowIdUtils:
    "resource:///modules/workspacesWindowIdUtils.sys.mjs",
  workspacesDataSaver:
    "resource:///modules/workspacesDataSaver.sys.mjs",
});

export const workspacesIdUtils = {
    async getWorkspaceByIdAndWindowId(workspaceId, windowId) {
        let workspacesData = await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
        return workspacesData[workspaceId];
    },

    async getWorkspaceIdByTab(tab, windowId) {
        let workspacesData = await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
        for (let workspaceId in workspacesData) {
            let workspace = workspacesData[workspaceId];
            if (!workspace.tabs) {
                return null;
            }

            if (workspace.tabs.includes(tab.workspaceId)) {
                return workspaceId;
            }
        }
        return null;
    },

    async getWorkspaceContainerUserContextId(workspaceId, windowId) {
        let workspace = await this.getWorkspaceByIdAndWindowId(workspaceId, windowId);
        return workspace.userContextId;
    },

    async removeWorkspaceById(workspaceId, windowId) {
        let workspacesData = await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
        delete workspacesData[workspaceId];
        await lazy.workspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
    },

    async removeWindowWorkspacesDataById(windowId) {
        let json = await IOUtils.readJSON(lazy.workspacesExternalFileService._workspacesStoreFile);
        delete json.windows[windowId];

        await IOUtils.writeJSON(lazy.workspacesExternalFileService._workspacesStoreFile, json);
    },

    async removeWindowTabsDataById(windowId) { 
        let json = await IOUtils.readJSON(lazy.workspacesExternalFileService._workspacesStoreFile);
        let windowWorkspacesData = json.windows[windowId];
        for (let workspaceId in windowWorkspacesData) {
            let workspace = windowWorkspacesData[workspaceId];
            if (workspace.tabs) {
                let workspace = windowWorkspacesData[workspaceId];
                workspace.tabs = [];
            }
        }

        await IOUtils.writeJSON(lazy.workspacesExternalFileService._workspacesStoreFile, json);
    }
};
