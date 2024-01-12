/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = [
  "WorkspacesService",
  "workspacesPreferences",
  "WorkspacesGroupService",
  "WorkspacesWindowUuidService",
  "workspaceIcons",
  "getWorkspaceIconUrl",
];

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  WorkspacesWindowIdUtils:
    "resource:///modules/WorkspacesWindowIdUtils.sys.mjs",
  WorkspacesDataSaver: "resource:///modules/WorkspacesDataSaver.sys.mjs",
});

function generateUuid() {
  return Services.uuid.generateUUID().toString();
}

export const WorkspacesService = {
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
      await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    let workspaceId = generateUuid();

    workspacesData[workspaceId] = {
      name,
      tabs: [],
      defaultWorkspace: defaultWorkspace || false,
      id: workspaceId,
    };
    await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
    return workspaceId;
  },

  async deleteWorkspace(workspaceId, windowId) {
    let workspacesData =
      await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    delete workspacesData[workspaceId];
    await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },

  async renameWorkspace(workspaceId, newName, windowId) {
    let workspacesData =
      await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    workspacesData[workspaceId].name = newName;
    await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },

  async setDefaultWorkspace(workspaceId, windowId) {
    let workspacesData =
      await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    workspacesData.preferences = {
      defaultWorkspace: workspaceId,
    };
    await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },

  async setSelectWorkspace(workspaceId, windowId) {
    let workspacesData =
      await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);

    if (!workspacesData.preferences) {
      workspacesData.preferences = {};
    }

    workspacesData.preferences.selectedWorkspaceId = workspaceId;

    await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },

  async setWorkspaceContainerUserContextIdAndIcon(
    workspaceId,
    userContextId,
    icon,
    windowId
  ) {
    let workspacesData =
      await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    workspacesData[workspaceId].userContextId = userContextId;
    workspacesData[workspaceId].icon = icon;
    await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },

  async setWorkspaceIcon(workspaceId, icon, windowId) {
    let workspacesData =
      await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    workspacesData[workspaceId].icon = icon;
    await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },

  async setWorkspaceContainerUserContextId(
    workspaceId,
    userContextId,
    windowId
  ) {
    let workspacesData =
      await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    workspacesData[workspaceId].userContextId = userContextId;
    await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },
};

export const WorkspacesGroupService = {
  reorderingWorkspacesGroupBefore(workspaceId, beforeWorkspaceId, windowId) {
    let workspacesData =
      lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
    let workspaceIds = Object.keys(workspacesData);
    let index = workspaceIds.indexOf(workspaceId);
    let beforeIndex = workspaceIds.indexOf(beforeWorkspaceId);
    workspaceIds.splice(index, 1);
    workspaceIds.splice(beforeIndex, 0, workspaceId);
    workspacesData[workspaceId].tabs = workspaceIds;
    lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },
};

export const workspaceIcons = new Set([
  "article",
  "book",
  "briefcase",
  "cart",
  "chat",
  "chill",
  "circle",
  "compass",
  "code",
  "dollar",
  "fence",
  "fingerprint",
  "food",
  "fruit",
  "game",
  "gear",
  "gift",
  "key",
  "lightning",
  "network",
  "notes",
  "paint",
  "photo",
  "pin",
  "pet",
  "question",
  "smartphone",
  "star",
  "tree",
  "vacation",
  "love",
  "moon",
  "music",
  "user",
]);

export function getWorkspaceIconUrl(icon) {
  if (!workspaceIcons.has(icon) || icon == undefined) {
    return "chrome://browser/skin/workspace-icons/fingerprint.svg";
  }
  return `chrome://browser/skin/workspace-icons/${icon}.svg`;
}

export const workspacesPreferences = {
  TAB_STACKS_ENABLED_PREF: "floorp.browser.workspaces.enabled",
  WORKSPACE_CLOSE_POPUP_AFTER_CLICK_PREF:
    "floorp.browser.workspace.closePopupAfterClick",
  WORKSPACE_MANAGE_ON_BMS_PREF: "floorp.browser.workspace.manageOnBMS",
  WORKSPACE_SHOW_WORKSPACE_NAME_PREF:
    "floorp.browser.workspace.showWorkspaceName",
};

export const WorkspacesWindowUuidService = {
  getGeneratedUuid() {
    return generateUuid();
  },
};
