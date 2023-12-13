/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = [
  "workspacesService",
  "workspacesPreferences",
  "WorkspacesGroupService",
];

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  workspacesWindowIdUtils:
    "resource:///modules/workspacesWindowIdUtils.sys.mjs",
  workspacesDataSaver:
    "resource:///modules/workspacesDataSaver.sys.mjs",
});

function generateUuid() {
  return Services.uuid.generateUUID().toString();
}

export const workspacesService = {
  get workspacesTabAttributionId() {
    return "floorpWorkspaceId";
  },

  get workspaceLastShowId() {
    return "floorpWorkspaceLastShowId";
  },

  get workspaceEnabled() {
    return Services.prefs.getBoolPref(
      workspacesPreferences.TAB_STACKS_ENABLED_PREF,
      false
    );
  },

  async createWorkspace(name, windowId, defaultWorkspace) {
    let workspacesData =
      await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    let workspaceId = generateUuid();

    workspacesData[workspaceId] = {
      name,
      tabs: [],
      defaultWorkspace: defaultWorkspace || false,
      id: workspaceId,
    };
    await lazy.workspacesDataSaver.saveWorkspacesData(
      workspacesData,
      windowId
    );
    return workspaceId;
  },

  async deleteWorkspace(workspaceId, windowId) {
    let workspacesData =
      await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    delete workspacesData[workspaceId];
    await lazy.workspacesDataSaver.saveWorkspacesData(
      workspacesData,
      windowId
    );
  },

  async renameWorkspace(workspaceId, newName, windowId) {
    let workspacesData =
      await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    workspacesData[workspaceId].name = newName;
    await lazy.workspacesDataSaver.saveWorkspacesData(
      workspacesData,
      windowId
    );
  },

  async addTabToWorkspace(workspaceId, tabs, windowId) {
    let workspacesData =
      await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    for (let tab of tabs) {
      workspacesData[workspaceId].tabs.push(tab.workspaceId);
    }
    await lazy.workspacesDataSaver.saveWorkspacesData(
      workspacesData,
      windowId
    );
  },

  async setDefaultWorkspace(workspaceId, windowId) {
    let workspacesData =
      await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    workspacesData.preferences = {
      defaultWorkspace: workspaceId,
    };
    await lazy.workspacesDataSaver.saveWorkspacesData(
      workspacesData,
      windowId
    );
  },

  async setSelectWorkspace(workspaceId, windowId) {
    let workspacesData =
      await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);

    if (!workspacesData.preferences) {
      workspacesData.preferences = {};
    }

    workspacesData.preferences.selectedWorkspaceId = workspaceId;

    await lazy.workspacesDataSaver.saveWorkspacesData(
      workspacesData,
      windowId
    );
  },

  async setWorkspaceContainerUserContextId(workspaceId, userContextId, windowId) {
    let workspacesData =
      await lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    workspacesData[workspaceId].userContextId = userContextId;
    await lazy.workspacesDataSaver.saveWorkspacesData(
      workspacesData,
      windowId
    );
  },
};

export const WorkspacesGroupService = {
  reorderingWorkspacesGroupBefore(workspaceId, beforeWorkspaceId, windowId) {
    let workspacesData =
      lazy.workspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    let workspaceIds = Object.keys(workspacesData);
    let index = workspaceIds.indexOf(workspaceId);
    let beforeIndex = workspaceIds.indexOf(beforeWorkspaceId);
    workspaceIds.splice(index, 1);
    workspaceIds.splice(beforeIndex, 0, workspaceId);
    workspacesData[workspaceId].tabs = workspaceIds;
    lazy.workspacesDataSaver.saveWorkspacesData(
      workspacesData,
      windowId
    );
  },
};

export const workspacesPreferences = {
  TAB_STACKS_ENABLED_PREF: "floorp.browser.Workspaces.enabled",
};
