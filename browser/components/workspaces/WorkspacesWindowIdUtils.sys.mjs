/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["WorkspacesWindowIdUtils"];

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
	WorkspacesExternalFileService:
		"resource:///modules/WorkspacesExternalFileService.sys.mjs",
});

export const WorkspacesWindowIdUtils = {
	get _workspacesStoreFile() {
		return lazy.WorkspacesExternalFileService._workspacesStoreFile;
	},

	async getAllWindowAndWorkspacesData() {
		const fileExists = await IOUtils.exists(this._workspacesStoreFile);
		if (!fileExists) {
			IOUtils.writeJSON(this._workspacesStoreFile, {});
			return {};
		}

		const json = await IOUtils.readJSON(this._workspacesStoreFile);
		return json;
	},

	async getWindowWorkspacesData(windowId) {
		const fileExists = await IOUtils.exists(this._workspacesStoreFile);
		if (!fileExists) {
			const obj = {
				windows: {},
			};

			IOUtils.writeJSON(this._workspacesStoreFile, obj);
			return obj;
		}

		const json = await IOUtils.readJSON(this._workspacesStoreFile);
		const result = json.windows[windowId] || {};
		return result;
	},

	async getWindowWorkspacesDataWithoutPreferences(windowId) {
		const workspacesData = await this.getWindowWorkspacesData(windowId);
		delete workspacesData.preferences;
		return workspacesData;
	},

	async getWindowWorkspacesCount(windowId) {
		const workspacesData = await this.getWindowWorkspacesData(windowId);
		const workspacesCount = Object.keys(workspacesData).length;
		return workspacesCount;
	},

	async getDefaultWorkspaceId(windowId) {
		const workspacesData = await this.getWindowWorkspacesData(windowId);
		for (const workspaceId in workspacesData) {
			const workspace = workspacesData[workspaceId];
			if (workspace.defaultWorkspace) {
				return workspaceId;
			}
		}
		return null;
	},

	async getSelectedWorkspaceId(windowId) {
		const workspacesData = await this.getWindowWorkspacesData(windowId);
		const preferences = workspacesData.preferences || {};
		if (preferences.selectedWorkspaceId) {
			return preferences.selectedWorkspaceId;
		}

		const defaultWorkspaceId = await this.getDefaultWorkspaceId(windowId);
		if (defaultWorkspaceId) {
			return defaultWorkspaceId;
		}

		return null;
	},

	async getAllWorkspacesId(windowId) {
		const workspacesData =
			await this.getWindowWorkspacesDataWithoutPreferences(windowId);
		const workspacesIds = Object.keys(workspacesData);
		return workspacesIds;
	},
};
