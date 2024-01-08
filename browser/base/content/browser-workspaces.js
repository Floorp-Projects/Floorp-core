/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { WorkspacesMigratorUtils } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesMigratorUtils.sys.mjs",
);

const { WorkspacesService } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesService.sys.mjs",
);

const { getWorkspaceIconUrl } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesService.sys.mjs",
);

const { workspacesPreferences } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesService.sys.mjs",
);

const { WorkspacesWindowUuidService } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesService.sys.mjs",
);

const { WorkspacesIdUtils } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesIdUtils.sys.mjs",
);

const { WorkspacesElementService } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesElementService.sys.mjs",
);

const { WorkspacesWindowIdUtils } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesWindowIdUtils.sys.mjs",
);

const { WorkspacesDataSaver } = ChromeUtils.importESModule(
	"resource:///modules/WorkspacesDataSaver.sys.mjs",
);

const { XPCOMUtils } = ChromeUtils.importESModule(
	"resource://gre/modules/XPCOMUtils.sys.mjs",
);

XPCOMUtils.defineLazyScriptGetter(
	this,
	"gWorkspacesWindowUtils",
	"chrome://browser/content/browser-workspaces.js",
);

// global variable
const gBrowser = window.gBrowser;

var gWorkspaces = {
	_initialized: false,
	_windowId: null,
	_currentWorkspaceId: null,
	_popuppanelNotFound: false,
	_workspaceManageOnBMSMode: false,
	_workspacesTemporarilyDisabled: false,

	/** Elements */
	get titlebar() {
		return document.getElementById("titlebar");
	},

	get TabsToolbar() {
		return document.getElementById("TabsToolbar");
	},

	get workspacesToolbarButtonPanel() {
		return document.getElementById("workspacesToolbarButtonPanel");
	},

	get workspacesToolbarButton() {
		return document.getElementById("workspaces-toolbar-button");
	},

	get workspacesPopupContent() {
		return document.getElementById("workspacesPopupContent");
	},

	get arrowscrollbox() {
		return document.getElementById("tabbrowser-arrowscrollbox");
	},

	get TabsToolbartoolbarItems() {
		return document.querySelector("#TabsToolbar .toolbar-items");
	},

	get workspaceButtons() {
		return document.querySelectorAll(".workspaceButton");
	},

	get l10n() {
		const l10n = new Localization(
			["browser/floorp.ftl", "branding/brand.ftl"],
			true,
		);
		return l10n;
	},

	/** Workspaces Toolbar */
	async rebuildWorkspacesToolbar() {
		if (!gWorkspaces.workspacesPopupContent) {
			gWorkspaces._popuppanelNotFound = true;
			return;
		}
		gWorkspaces._popuppanelNotFound = false;

		// Remove all Workspaces toolbar
		while (gWorkspaces.workspaceButtons.length) {
			gWorkspaces.workspacesPopupContent.firstChild.remove();
		}

		// Add all Workspaces toolbar
		const workspaceBlockElements =
			await gWorkspaces.getAllWorkspacesBlockElements();
		for (const workspaceBlockElement of workspaceBlockElements) {
			const workspaceBlockElementFragment =
				window.MozXULElement.parseXULToFragment(workspaceBlockElement);
			gWorkspaces.workspacesPopupContent.appendChild(
				workspaceBlockElementFragment,
			);
		}

		await this.updateToolbarButtonAndPopupContentIconAndLabel(
			await this.getCurrentWorkspaceId(),
		);
	},

	async rebuildWorkspacesLabels() {
		const workspacesData = await this.getCurrentWorkspacesData();
		for (const workspaceId in workspacesData) {
			const workspace = workspacesData[workspaceId];
			const workspaceToolbarButton = document.getElementById(
				`workspace-${workspaceId}`,
			);
			if (workspaceToolbarButton) {
				workspaceToolbarButton.setAttribute("label", workspace.name);
			}
		}
	},

	async addToolbarWorkspaceButtonToAppend(workspaceId) {
		const toolbarWorkspaceButton = await this.getWorkspaceBlockElement(
			workspaceId,
			this._workspaceManageOnBMSMode,
		);
		const toolbarWorkspaceButtonFragment =
			window.MozXULElement.parseXULToFragment(toolbarWorkspaceButton);
		this.workspacesPopupContent.appendChild(toolbarWorkspaceButtonFragment);
	},

	async changeToolbarSelectedWorkspaceView(workspaceId) {
		const selectedWorkspaceToolbarButton = document.querySelector(
			`.workspaceButton[selected="true"]`,
		);

		if (selectedWorkspaceToolbarButton) {
			selectedWorkspaceToolbarButton.removeAttribute("selected");
		}

		const workspaceToolbarButton = document.getElementById(
			`workspace-${workspaceId}`,
		);

		if (workspaceToolbarButton) {
			workspaceToolbarButton.setAttribute("selected", true);
		}

		await this.updateToolbarButtonAndPopupContentIconAndLabel(workspaceId);
	},

	async updateToolbarButtonAndPopupContentIconAndLabel(workspaceId) {
		const workspace = await this.getWorkspaceById(workspaceId);
		if (this.workspacesToolbarButton) {
			this.workspacesToolbarButton.setAttribute("label", workspace.name);
			this.workspacesToolbarButton.style.listStyleImage = `url(${getWorkspaceIconUrl(
				workspace.icon,
			)})`;

			const popupElements = document.getElementsByClassName("workspaceButton");

			for (const popupElement of popupElements) {
				const workspaceId = popupElement.getAttribute("workspaceId");
				const workspace = await this.getWorkspaceById(workspaceId);

				popupElement.setAttribute("label", workspace.name);
				popupElement.style.listStyleImage = `url(${getWorkspaceIconUrl(
					workspace.icon,
				)})`;
			}
		}
	},

	enableWorkspacesManageOnBMSMode() {
		const bmsSidebar = document.getElementById("sidebar-select-box");
		bmsSidebar.prepend(this.workspacesPopupContent);

		const CSS = WorkspacesElementService.manageOnBmsInjectionCSS;
		document.head.appendChild(document.createElement("style")).textContent =
			CSS;
		for (const workspaceButton of this.workspaceButtons) {
			workspaceButton.classList.add("sidepanel-icon");
		}

		const spacerElem = window.MozXULElement.parseXULToFragment(
			WorkspacesElementService.workspaceSpacerElement,
		);
		this.workspacesPopupContent.after(spacerElem);
		this.workspacesPopupContent.after(
			document.getElementById("workspacesCreateNewWorkspaceButton"),
		);
		document
			.getElementById("workspacesCreateNewWorkspaceButton")
			.classList.add("sidepanel-icon");

		this._workspaceManageOnBMSMode = true;
	},

	/* Preferences */
	get workspaceEnabled() {
		return Services.prefs.getBoolPref(
			workspacesPreferences.TAB_STACKS_ENABLED_PREF,
			false,
		);
	},

	/* get Workspaces infomation */
	getCurrentWindowId() {
		let windowId = gWorkspaces._windowId;
		if (windowId == null) {
			windowId = WorkspacesWindowUuidService.getGeneratedUuid();
			gWorkspaces._windowId = windowId;
		}
		return windowId;
	},

	async getCurrentWorkspace() {
		const windowId = this.getCurrentWindowId();
		const workspaceId =
			await WorkspacesWindowIdUtils.getSelectedWorkspaceId(windowId);

		if (workspaceId == null) {
			const id = await WorkspacesWindowIdUtils.getDefaultWorkspaceId(windowId);
			const workspace = await WorkspacesIdUtils.getWorkspaceByIdAndWindowId(
				id,
				windowId,
			);
			return workspace;
		}

		const workspace = await WorkspacesIdUtils.getWorkspaceByIdAndWindowId(
			workspaceId,
			windowId,
		);
		return workspace;
	},

	async getCurrentWorkspaceId() {
		const currentWorkspace = await this.getCurrentWorkspace();
		if (!currentWorkspace) {
			return null;
		}
		return currentWorkspace.id;
	},

	async getCurrentWorkspacesData() {
		const windowId = this.getCurrentWindowId();
		const workspacesData =
			await WorkspacesWindowIdUtils.getWindowWorkspacesData(windowId);
		return workspacesData;
	},

	async getCurrentWorkspacesDataWithoutPreferences() {
		const windowId = this.getCurrentWindowId();
		const workspacesData =
			await WorkspacesWindowIdUtils.getWindowWorkspacesDataWithoutPreferences(
				windowId,
			);
		return workspacesData;
	},

	async getCurrentWorkspacesCount() {
		const windowId = this.getCurrentWindowId();
		const workspacesCount =
			await WorkspacesWindowIdUtils.getWindowWorkspacesCount(windowId);
		return workspacesCount;
	},

	async getDefaultWorkspace() {
		const windowId = this.getCurrentWindowId();
		const defaultWorkspaceId =
			await WorkspacesWindowIdUtils.getDefaultWorkspaceId(windowId);
		const defaultWorkspace =
			await WorkspacesIdUtils.getWorkspaceByIdAndWindowId(
				defaultWorkspaceId,
				windowId,
			);
		return defaultWorkspace;
	},

	async getDefaultWorkspaceId() {
		const windowId = this.getCurrentWindowId();
		const defaultWorkspaceId =
			await WorkspacesWindowIdUtils.getDefaultWorkspaceId(windowId);
		return defaultWorkspaceId;
	},

	async getAllWorkspacesBlockElements() {
		const windowId = this.getCurrentWindowId();
		const result = await WorkspacesElementService.getAllWorkspacesBlockElements(
			windowId,
			this._workspaceManageOnBMSMode,
		);
		return result;
	},

	async getWorkspaceBlockElement(workspaceId) {
		const windowId = this.getCurrentWindowId();
		const result = await WorkspacesElementService.getWorkspaceBlockElement(
			workspaceId,
			windowId,
			this._workspaceManageOnBMSMode,
		);
		return result;
	},

	async getWorkspaceById(workspaceId) {
		const windowId = this.getCurrentWindowId();
		const result = await WorkspacesIdUtils.getWorkspaceByIdAndWindowId(
			workspaceId,
			windowId,
		);
		return result;
	},

	/* Workspaces saver */
	async saveWorkspacesData(workspacesData) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
	},

	async saveWorkspacesDataWithoutOverwritingPreferences(workspacesData) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesDataSaver.saveWorkspacesDataWithoutOverwritingPreferences(
			workspacesData,
			windowId,
		);
	},

	async saveWorkspaceData(workspaceData) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesDataSaver.saveWorkspaceData(workspaceData, windowId);
	},

	async saveWindowPreferences(preferences) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesDataSaver.saveWindowPreferences(preferences, windowId);
	},

	/* tab attribute */
	getWorkspaceIdFromAttribute(tab) {
		const workspaceId = tab.getAttribute(this.workspacesTabAttributionId);
		return workspaceId;
	},

	setWorkspaceIdToAttribute(tab, workspaceId) {
		tab.setAttribute(this.workspacesTabAttributionId, workspaceId);
	},

	/* Workspaces remover */
	async removeTabFromWorkspace(workspaceId, tab) {
		const workspacesData = await this.getCurrentWorkspacesData();
		const index = workspacesData[workspaceId].tabs.indexOf(
			tab.getAttribute(this.workspacesTabAttributionId),
		);
		workspacesData[workspaceId].tabs.splice(index, 1);
		await this.saveWorkspacesData(workspacesData);
	},

	async removeWorkspaceById(workspaceId) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesIdUtils.removeWorkspaceById(workspaceId, windowId);
		this.removeWorkspaceTabs(workspaceId);
	},

	async removeWindowWorkspacesDataById() {
		const windowId = this.getCurrentWindowId();
		await WorkspacesIdUtils.removeWindowWorkspacesDataById(windowId);
	},

	/* Workspaces manager */
	async createWorkspace(name, defaultWorkspace, addNewTab) {
		const windowId = this.getCurrentWindowId();
		const createdWorkspaceId = await WorkspacesService.createWorkspace(
			name,
			windowId,
			defaultWorkspace,
		);
		this.changeWorkspace(
			createdWorkspaceId,
			defaultWorkspace ? 1 : 2,
			addNewTab ? addNewTab : false,
		);
	},

	async createNoNameWorkspace() {
		await this.createWorkspace("New Workspace", false, true);
	},

	async deleteWorkspace(workspaceId) {
		const windowId = this.getCurrentWindowId();
		const currentWorkspaceId = await this.getCurrentWorkspaceId();
		await WorkspacesService.deleteWorkspace(workspaceId, windowId);
		this.removeWorkspaceTabs(workspaceId);
		if (workspaceId == currentWorkspaceId) {
			this.changeWorkspace(
				await WorkspacesWindowIdUtils.getDefaultWorkspaceId(windowId),
			);
		}
		this.rebuildWorkspacesToolbar();
	},

	async renameWorkspace(workspaceId, newName) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesService.renameWorkspace(workspaceId, newName, windowId);
	},

	async setDefaultWorkspace(workspaceId) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesService.setDefaultWorkspace(workspaceId, windowId);

		// rebuild the workspacesToolbar
		gWorkspaces.rebuildWorkspacesToolbar(windowId);
	},

	changeWorkspace(workspaceId, option, addNewTab = true) {
		// Change Workspace
		const willChangeWorkspaceLastShowTab =
			gWorkspaces.getWorkspaceselectedTab(workspaceId);

		if (willChangeWorkspaceLastShowTab) {
			gBrowser.selectedTab = willChangeWorkspaceLastShowTab;
		} else if (addNewTab) {
			const tab = gWorkspaces.createTabForWorkspace(workspaceId);
			gBrowser.selectedTab = tab;
		}

		gWorkspaces.setSelectWorkspace(workspaceId);

		switch (option) {
			case 1:
				// rebuild the workspaces Toolbar
				gWorkspaces.rebuildWorkspacesToolbar();
				gWorkspaces.changeToolbarSelectedWorkspaceView(workspaceId);
				gWorkspaces.updateToolbarButtonAndPopupContentIconAndLabel(workspaceId);
				break;
			case 2:
				// Append Workspaces Toolbar Workspace Button
				gWorkspaces.addToolbarWorkspaceButtonToAppend(workspaceId);
				gWorkspaces.changeToolbarSelectedWorkspaceView(workspaceId);
				break;
			default:
				// Change Workspaces Toolbar Selected Workspace View
				gWorkspaces.changeToolbarSelectedWorkspaceView(workspaceId);
				break;
		}
		gWorkspaces.checkAllTabsForVisibility();
	},

	async workspaceIdExists(workspaceId) {
		const windowId = this.getCurrentWindowId();
		const result = await WorkspacesIdUtils.workspaceIdExists(
			workspaceId,
			windowId,
		);
		return result;
	},

	async setSelectWorkspace(workspaceId) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesService.setSelectWorkspace(workspaceId, windowId);
	},

	/* tab manager */
	get workspacesTabAttributionId() {
		return WorkspacesService.workspacesTabAttributionId;
	},

	get workspaceLastShowTabAttributionId() {
		return WorkspacesService.workspaceLastShowId;
	},

	moveTabToWorkspace(workspaceId, tab) {
		this.setWorkspaceIdToAttribute(tab, workspaceId);
		if (tab === gBrowser.selectedTab) {
			gWorkspaces.changeWorkspace(workspaceId);
		} else {
			gWorkspaces.checkAllTabsForVisibility();
		}
	},

	createTabForWorkspace(workspaceId, url) {
		if (!url) {
			url = Services.prefs.getStringPref("browser.startup.homepage");
		}

		const tab = gBrowser.addTab(url, {
			skipAnimation: true,
			inBackground: false,
			triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
		});
		this.setWorkspaceIdToAttribute(tab, workspaceId);
		return tab;
	},

	getWorkspaceFirstTab(workspaceId) {
		for (const tab of gBrowser.tabs) {
			if (tab.getAttribute(this.workspacesTabAttributionId) == workspaceId) {
				return tab;
			}
		}
		return null;
	},

	checkWorkspaceHasTab(workspaceId) {
		const firstTab = this.getWorkspaceFirstTab(workspaceId);
		if (firstTab) {
			return true;
		}
		return false;
	},

	getWorkspaceselectedTab(workspaceId) {
		for (const tab of gBrowser.tabs) {
			if (
				tab.getAttribute(this.workspaceLastShowTabAttributionId) == workspaceId
			) {
				return tab;
			}
		}
		return null;
	},

	removeWorkspaceTabs(workspaceId) {
		for (const tab of gBrowser.tabs) {
			if (tab.getAttribute(this.workspacesTabAttributionId) == workspaceId) {
				gBrowser.removeTab(tab);
			}
		}
	},

	/* Popup & dialog functions */

	async renameWorkspaceWithCreatePrompt(workspaceId) {
		const prompts = Services.prompt;
		const workspace = await gWorkspaces.getWorkspaceById(workspaceId);
		const input = { value: workspace.name };
		const result = await prompts.prompt(
			window,
			this.l10n.formatValueSync("rename-workspace-prompt-title"),
			this.l10n.formatValueSync("rename-workspace-prompt-text"),
			input,
			null,
			{ value: 0 },
		);

		if (result) {
			await gWorkspaces.renameWorkspace(workspaceId, input.value);
			gWorkspaces.rebuildWorkspacesLabels();
		}
	},

	async manageWorkspaceFromDialog(workspaceId = null) {
		if (!workspaceId) {
			workspaceId = await gWorkspaces.getDefaultWorkspaceId();
		}

		let parentWindow = window;
		const object = { workspaceId };
		if (
			parentWindow?.document.documentURI ==
			"chrome://browser/content/hiddenWindowMac.xhtml"
		) {
			parentWindow = null;
		}
		if (parentWindow?.gDialogBox) {
			parentWindow.gDialogBox.open(
				"chrome://browser/content/preferences/dialogs/manageWorkspace.xhtml",
				object,
			);
		} else {
			Services.ww.openWindow(
				parentWindow,
				"chrome://browser/content/preferences/dialogs/manageWorkspace.xhtml",
				null,
				"chrome,titlebar,dialog,centerscreen,modal",
				object,
			);
		}
	},

	/* workspace icon Service */
	async getWorkspaceIcon(workspaceId) {
		const windowId = this.getCurrentWindowId();
		const icon = await WorkspacesIdUtils.getWorkspaceIconByIdAndWindowId(
			workspaceId,
			windowId,
		);
		return icon;
	},

	async setWorkspaceIcon(workspaceId, icon) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesService.setWorkspaceIcon(workspaceId, icon, windowId);
	},

	/* userContext Service */
	async getWorkspaceContainerUserContextId(workspaceId) {
		const windowId = this.getCurrentWindowId();
		const userContextId =
			await WorkspacesIdUtils.getWorkspaceContainerUserContextId(
				workspaceId,
				windowId,
			);
		return userContextId;
	},

	async setWorkspaceContainerUserContextId(workspaceId, userContextId) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesService.setWorkspaceContainerUserContextId(
			workspaceId,
			userContextId,
			windowId,
		);
	},

	async setWorkspaceContainerUserContextIdAndIcon(
		workspaceId,
		userContextId,
		icon,
	) {
		const windowId = this.getCurrentWindowId();
		await WorkspacesService.setWorkspaceContainerUserContextIdAndIcon(
			workspaceId,
			userContextId,
			icon,
			windowId,
		);

		this.updateToolbarButtonAndPopupContentIconAndLabel(workspaceId);
	},

	/* Visibility Service */
	async checkAllTabsForVisibility() {
		// Check all tabs for visibility
		// Get Current Workspace & Workspace Id
		// Get Current Window Id

		const windowId = gWorkspaces.getCurrentWindowId();
		// Remove all tab infomation from json
		await WorkspacesIdUtils.removeWindowTabsDataById(windowId);

		const currentWorkspaceId = await gWorkspaces.getCurrentWorkspaceId();
		const workspace = await gWorkspaces.getCurrentWorkspace();
		const workspacesData = await gWorkspaces.getCurrentWorkspacesData();
		const workspacesCount = await gWorkspaces.getCurrentWorkspacesCount();

		// Check all tabs for visibility
		const tabs = gBrowser.tabs;
		for (let i = 0; i < tabs.length; i++) {
			// Set workspaceId if workspaceId is null
			const workspaceId = gWorkspaces.getWorkspaceIdFromAttribute(tabs[i]);
			if (
				!(
					workspaceId !== "" &&
					workspaceId !== null &&
					workspaceId !== undefined
				)
			) {
				gWorkspaces.setWorkspaceIdToAttribute(tabs[i], currentWorkspaceId);
			}

			const chackedWorkspaceId = gWorkspaces.getWorkspaceIdFromAttribute(
				tabs[i],
			);
			if (workspacesCount > 1) {
				if (chackedWorkspaceId == currentWorkspaceId) {
					gBrowser.showTab(tabs[i]);
				} else {
					gBrowser.hideTab(tabs[i]);
				}
			}

			const tabObj = {
				url: tabs[i].linkedBrowser.currentURI.spec,
				tabId: i,
				userContextId: tabs[i].userContextId ? tabs[i].userContextId : 0,
			};

			// Last tab attribute
			const selectedTab = gBrowser.selectedTab;
			const newWorkspaceId = currentWorkspaceId;
			if (tabs[i] == selectedTab) {
				// Remove Last tab attribute from another tab
				const lastShowTabs = document.querySelectorAll(
					`[${this.workspaceLastShowTabAttributionId}="${newWorkspaceId}"]`,
				);
				for (let i = 0; i < lastShowTabs.length; i++) {
					lastShowTabs[i].removeAttribute(
						this.workspaceLastShowTabAttributionId,
					);
				}

				tabs[i].setAttribute(
					this.workspaceLastShowTabAttributionId,
					newWorkspaceId,
				);
				tabObj.lastShow = true;
			}

			// Save Workspaces data
			workspacesData[workspace.id].tabs.push(tabObj);
		}
		// Save Workspaces data
		await gWorkspaces.saveWorkspacesDataWithoutOverwritingPreferences(
			workspacesData,
		);

		gWorkspaces._currentWorkspaceId = currentWorkspaceId;
	},

	/* init */
	async init() {
		if (this._initialized) {
			return;
		}

		if (!this.workspaceEnabled) {
			return;
		}

		// toolbar button
		// eslint-disable-next-line no-undef
		workspacesToolbarButton();

		// Initialized complete
		this._initialized = true;

		const currentWorkspace = await gWorkspaces.getCurrentWorkspace();

		// Check Workspaces Need migrate from Legacy Workspaces
		await WorkspacesMigratorUtils.importDataFromLegacyWorkspaces(
			gBrowser.tabs,
			this.getCurrentWindowId(),
		);

		if (
			!currentWorkspace ||
			currentWorkspace == null ||
			currentWorkspace == undefined
		) {
			await gWorkspaces.createWorkspace(
				this.l10n.formatValueSync("workspace-default-name"),
				true,
				false,
			);

			// Set default Workspace
			const workspaceId = await gWorkspaces.getCurrentWorkspaceId();
			await gWorkspaces.setSelectWorkspace(workspaceId);
		}

		async function checkURLChange() {
			await gWorkspaces.checkAllTabsForVisibility();
		}

		// Use internal APIs to detect when the current tab changes.
		setInterval(checkURLChange, 1000);

		const events = ["TabSelect", "TabPinned", "TabUnpinned"];

		for (const event of events) {
			gBrowser.tabContainer.addEventListener(
				event,
				gWorkspaces.checkAllTabsForVisibility,
			);
		}

		// Add injection CSS
		const styleElemInjectToToolbar = document.createElement("style");
		styleElemInjectToToolbar.id = "workspacesInjectionCSS";
		styleElemInjectToToolbar.textContent =
			WorkspacesElementService.injectionCSS;
		document.head.appendChild(styleElemInjectToToolbar);

		// build Workspaces toolbar
		await gWorkspaces.rebuildWorkspacesToolbar();

		// Set current Workspace Id
		this._currentWorkspaceId = await this.getCurrentWorkspaceId();
		this.checkAllTabsForVisibility();

		// set selected Workspace
		this.changeToolbarSelectedWorkspaceView(this._currentWorkspaceId);

		// Create Context Menu
		this.contextMenu.createWorkspacesTabContextMenuItems();

		// Override the default newtab opening position in tabbar.
		//copy from browser.js (./browser/base/content/browser.js)
		// eslint-disable-next-line no-undef
		BrowserOpenTab = async function ({
			event,
			// eslint-disable-next-line no-undef
			url = BROWSER_NEW_TAB_URL,
		} = {}) {
			let relatedToCurrent = false; //"relatedToCurrent" decide where to open the new tab. Default work as last tab (right side). Floorp use this.
			let where = "tab";
			const currentWorkspaceContextId =
				await gWorkspaces.getWorkspaceContainerUserContextId(
					await gWorkspaces.getCurrentWorkspaceId(),
				);
			const _OPEN_NEW_TAB_POSITION_PREF = Services.prefs.getIntPref(
				"floorp.browser.tabs.openNewTabPosition",
			);

			switch (_OPEN_NEW_TAB_POSITION_PREF) {
				case 0:
					// Open the new tab as unrelated to the current tab.
					relatedToCurrent = false;
					break;
				case 1:
					// Open the new tab as related to the current tab.
					relatedToCurrent = true;
					break;
				default:
					if (event) {
						// eslint-disable-next-line no-undef
						where = whereToOpenLink(event, false, true);
						switch (where) {
							case "tab":
							case "tabshifted":
								// When accel-click or middle-click are used, open the new tab as
								// related to the current tab.
								relatedToCurrent = true;
								break;
							case "current":
								where = "tab";
								break;
						}
					}
			}

			//Wrote by Mozilla(Firefox)
			// A notification intended to be useful for modular peformance tracking
			// starting as close as is reasonably possible to the time when the user
			// expressed the intent to open a new tab.  Since there are a lot of
			// entry points, this won't catch every single tab created, but most
			// initiated by the user should go through here.
			//
			// Note 1: This notification gets notified with a promise that resolves
			//         with the linked browser when the tab gets created
			// Note 2: This is also used to notify a user that an extension has changed
			//         the New Tab page.
			Services.obs.notifyObservers(
				{
					wrappedJSObject: new Promise((resolve) => {
						// eslint-disable-next-line no-undef
						openTrustedLinkIn(url, where, {
							relatedToCurrent,
							resolveOnNewTabCreated: resolve,
							userContextId: gWorkspaces.workspaceEnabled
								? currentWorkspaceContextId
								: 0,
						});
					}),
				},
				"browser-open-newtab-start",
			);
		};
	},

	eventListeners: {
		async onTabBarStateChanged(reason) {
			// Change Workspaces toolbar visibility
			await gWorkspaces.checkAllTabsForVisibility();
		},
	},

	contextMenu: {
		async createWorkspacesContextMenuItems(event) {
			//delete already exsist items
			const menuElem = document.getElementById(
				"workspaces-toolbar-item-context-menu",
			);
			while (menuElem.firstChild) {
				menuElem.firstChild.remove();
			}

			const contextWorkspaceId = event.explicitOriginalTarget.id.replace(
				"workspace-",
				"",
			);
			const defaultWorkspaceId =
				await WorkspacesWindowIdUtils.getDefaultWorkspaceId(
					gWorkspaces.getCurrentWindowId(),
				);
			const isDefaultWorkspace = contextWorkspaceId == defaultWorkspaceId;

			//create context menu
			const menuItem = window.MozXULElement.parseXULToFragment(`
          <menuitem data-l10n-id="rename-this-workspace" accesskey="R" oncommand="gWorkspaces.renameWorkspaceWithCreatePrompt('${contextWorkspaceId}')"></menuitem>
          <menuitem data-l10n-id="delete-this-workspace" accesskey="D" ${
						isDefaultWorkspace ? 'disabled="true"' : ""
					} oncommand="gWorkspaces.deleteWorkspace('${contextWorkspaceId}')"></menuitem>
          <menuitem data-l10n-id="manage-this-workspaces" oncommand="gWorkspaces.manageWorkspaceFromDialog('${contextWorkspaceId}')"></menuitem>
        `);
			const parentElem = document.getElementById(
				"workspaces-toolbar-item-context-menu",
			);
			parentElem.appendChild(menuItem);
		},

		createWorkspacesTabContextMenuItems(event) {
			const beforeElem = document.getElementById("context_moveTabOptions");
			const menuitemElem = window.MozXULElement.parseXULToFragment(`
      <menu id="context_MoveTabToOtherWorkspace" data-l10n-id="move-tab-another-workspace" accesskey="D">
          <menupopup id="workspacesTabContextMenu" onpopupshowing="gWorkspaces.contextMenu.createWorkspacesContextMenuItems(event)"/>
      </menu>
      `);
			beforeElem.before(menuitemElem);
		},
	},
};

window.SessionStore.promiseInitialized.then(() => {
	window.setTimeout(() => {
		gWorkspaces.init();
	}, 2000);
});
