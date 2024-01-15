/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["WorkspacesIdUtils"];

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
	WorkspacesExternalFileService:
		"resource:///modules/WorkspacesExternalFileService.sys.mjs",
	WorkspacesWindowIdUtils:
		"resource:///modules/WorkspacesWindowIdUtils.sys.mjs",
	WorkspacesDataSaver: "resource:///modules/WorkspacesDataSaver.sys.mjs",
});

export const WorkspacesIdUtils = {
	async getWorkspaceByIdAndWindowId(workspaceId, windowId) {
		const workspacesData =
			await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
		return workspacesData[workspaceId];
	},

	async workspaceIdExists(workspaceId, windowId) {
		const workspacesData =
			await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
		return workspacesData.hasOwnProperty(workspaceId);
	},

	async getWorkspaceContainerUserContextId(workspaceId, windowId) {
		const workspace = await this.getWorkspaceByIdAndWindowId(
			workspaceId,
			windowId,
		);
		return workspace.userContextId;
	},

	async getWorkspaceIcon(workspaceId, windowId) {
		const workspace = await this.getWorkspaceByIdAndWindowId(
			workspaceId,
			windowId,
		);
		return workspace.icon;
	},

	async removeWorkspaceById(workspaceId, windowId) {
		const workspacesData =
			await lazy.WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
		delete workspacesData[workspaceId];
		await lazy.WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
	},

	async removeWindowWorkspacesDataById(windowId) {
		const json = await IOUtils.readJSON(
			lazy.WorkspacesExternalFileService._workspacesStoreFile,
		);
		delete json.windows[windowId];

		await IOUtils.writeJSON(
			lazy.WorkspacesExternalFileService._workspacesStoreFile,
			json,
		);
	},

	async removeWindowTabsDataById(windowId) {
		const json = await IOUtils.readJSON(
			lazy.WorkspacesExternalFileService._workspacesStoreFile,
		);
		const windowWorkspacesData = json.windows[windowId];
		for (const workspaceId in windowWorkspacesData) {
			const workspace = windowWorkspacesData[workspaceId];
			if (workspace.tabs) {
				const workspace = windowWorkspacesData[workspaceId];
				workspace.tabs = [];
			}
		}

		await IOUtils.writeJSON(
			lazy.WorkspacesExternalFileService._workspacesStoreFile,
			json,
		);
	},
};
