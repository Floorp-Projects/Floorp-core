/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { WorkspacesExternalFileService } = ChromeUtils.importESModule(
  "resource:///modules/WorkspacesExternalFileService.sys.mjs"
);

var { WorkspacesService } = ChromeUtils.importESModule(
  "resource:///modules/WorkspacesService.sys.mjs"
);

var { workspacesPreferences } = ChromeUtils.importESModule(
  "resource:///modules/WorkspacesService.sys.mjs"
);

var { WorkspacesWindowUuidService } = ChromeUtils.importESModule(
  "resource:///modules/WorkspacesService.sys.mjs"
);

var { WorkspacesIdUtils } = ChromeUtils.importESModule(
  "resource:///modules/WorkspacesIdUtils.sys.mjs"
);

var { WorkspacesElementService } = ChromeUtils.importESModule(
  "resource:///modules/WorkspacesElementService.sys.mjs"
);

var { WorkspacesWindowIdUtils } = ChromeUtils.importESModule(
  "resource:///modules/WorkspacesWindowIdUtils.sys.mjs"
);

var { WorkspacesDataSaver } = ChromeUtils.importESModule(
  "resource:///modules/WorkspacesDataSaver.sys.mjs"
);

var { XPCOMUtils } = ChromeUtils.importESModule(
  "resource://gre/modules/XPCOMUtils.sys.mjs"
);

XPCOMUtils.defineLazyScriptGetter(
  this,
  "gWorkspacesWindowUtils",
  "chrome://browser/content/browser-workspaces.js"
);

// global variable
var gBrowser = window.gBrowser;

var gWorkspaces = {
  _initialized: false,
  _windowId: null,
  _currentWorkspaceId: null,
  _popuppanelNotFound: false,
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

  /** Workspaces Toolbar */
  async rebuildWorkspacesToolbar() {
    if(!gWorkspaces.workspacesPopupContent) {
      gWorkspaces._popuppanelNotFound = true;
      return;
    } 
    gWorkspaces._popuppanelNotFound = false;

    // Remove all Workspaces toolbar
    while (gWorkspaces.workspaceButtons.length) {
      gWorkspaces.workspacesPopupContent.firstChild.remove();
    }

    // Add all Workspaces toolbar
    let workspaceBlockElements = await gWorkspaces.getAllWorkspacesBlockElements();
    for (let workspaceBlockElement of workspaceBlockElements) {
      let workspaceBlockElementFragment =
        window.MozXULElement.parseXULToFragment(workspaceBlockElement);
      gWorkspaces.workspacesPopupContent.appendChild(
        workspaceBlockElementFragment
      );
    }
  },

  async addToolbarWorkspaceButtonToAppend(workspaceId) {
    let toolbarWorkspaceButton = await this.getWorkspaceBlockElement(workspaceId);
    let toolbarWorkspaceButtonFragment = window.MozXULElement.parseXULToFragment(
      toolbarWorkspaceButton
    );
    this.workspacesPopupContent.appendChild(toolbarWorkspaceButtonFragment);
  },

  async changeToolbarSelectedWorkspaceView(workspaceId) {
    let selectedWorkspaceToolbarButton = document.querySelector(
      `.workspaceButton[selected="true"]`
    );

    if (selectedWorkspaceToolbarButton) {
      selectedWorkspaceToolbarButton.removeAttribute("selected");
    }

    let workspaceToolbarButton = document.getElementById(
      `workspace-${workspaceId}`
    );

    if (workspaceToolbarButton) {
      workspaceToolbarButton.setAttribute("selected", true);
    }
  },

  /* Preferences */
  get workspaceEnabled() {
    return Services.prefs.getBoolPref(
      workspacesPreferences.TAB_STACKS_ENABLED_PREF,
      false
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
    let windowId = this.getCurrentWindowId();
    let workspaceId = await WorkspacesWindowIdUtils.getSelectedWorkspaceId(
      windowId
    );

    if (workspaceId == null) {
      let id = await WorkspacesWindowIdUtils.getDefaultWorkspaceId(windowId);
      let workspace = await WorkspacesIdUtils.getWorkspaceByIdAndWindowId(
        id,
        windowId
      );
      return workspace;
    }

    let workspace = await WorkspacesIdUtils.getWorkspaceByIdAndWindowId(
      workspaceId,
      windowId
    );
    return workspace;
  },

  async getCurrentWorkspaceId() {
    let currentWorkspace = await this.getCurrentWorkspace();
    return currentWorkspace.id;
  },

  async getCurrentWorkspacesData() {
    let windowId = this.getCurrentWindowId();
    let workspacesData = await WorkspacesWindowIdUtils.getWindowWorkspacesData(
      windowId
    );
    return workspacesData;
  },

  async getCurrentWorkspacesDataWithoutPreferences() {
    let windowId = this.getCurrentWindowId();
    let workspacesData =
      await WorkspacesWindowIdUtils.getWindowWorkspacesDataWithoutPreferences(
        windowId
      );
    return workspacesData;
  },

  async getCurrentWorkspacesCount() {
    let windowId = this.getCurrentWindowId();
    let workspacesCount = await WorkspacesWindowIdUtils.getWindowWorkspacesCount(
      windowId
    );
    return workspacesCount;
  },

  async getAllWorkspacesBlockElements() {
    let windowId = this.getCurrentWindowId();
    let result = await WorkspacesElementService.getAllWorkspacesBlockElements(
      windowId
    );
    return result;
  },

  async getWorkspaceBlockElement(workspaceId) {
    let windowId = this.getCurrentWindowId();
    let result = await WorkspacesElementService.getWorkspaceBlockElement(
      workspaceId,
      windowId
    );
    return result;
  },

  /* Workspaces saver */
  async saveWorkspacesData(workspacesData) {
    let windowId = this.getCurrentWindowId();
    await WorkspacesDataSaver.saveWorkspacesData(workspacesData, windowId);
  },

  async saveWorkspacesDataWithoutOverwritingPreferences(workspacesData) {
    let windowId = this.getCurrentWindowId();
    await WorkspacesDataSaver.saveWorkspacesDataWithoutOverwritingPreferences(
      workspacesData,
      windowId
    );
  },

  async saveWindowPreferences(preferences) {
    let windowId = this.getCurrentWindowId();
    await WorkspacesDataSaver.saveWindowPreferences(preferences, windowId);
  },

  /* tab attribute */
  getWorkspaceIdFromAttribute(tab) {
    let workspaceId = tab.getAttribute(this.workspacesTabAttributionId);
    return workspaceId;
  },

  setWorkspaceIdToAttribute(tab, workspaceId) {
    tab.setAttribute(this.workspacesTabAttributionId, workspaceId);
  },

  /* Workspaces remover */
  async removeTabFromWorkspace(workspaceId, tab) {
    let workspacesData = await this.getCurrentWorkspacesData();
    let index = workspacesData[workspaceId].tabs.indexOf(
      tab.getAttribute(this.workspacesTabAttributionId)
    );
    workspacesData[workspaceId].tabs.splice(index, 1);
    await this.saveWorkspacesData(workspacesData);
  },

  async removeWorkspaceById(workspaceId) {
    let windowId = this.getCurrentWindowId();
    await WorkspacesIdUtils.removeWorkspaceById(workspaceId, windowId);
    this.removeWorkspaceTabs(workspaceId);
  },

  async removeWindowWorkspacesDataById() {
    let windowId = this.getCurrentWindowId();
    await WorkspacesIdUtils.removeWindowWorkspacesDataById(windowId);
  },

  /* Workspaces manager */
  async createWorkspace(name, defaultWorkspace, addNewTab) {
    let windowId = this.getCurrentWindowId();
    let createdWorkspaceId = await WorkspacesService.createWorkspace(
      name,
      windowId,
      defaultWorkspace
    );
    this.changeWorkspace(createdWorkspaceId, defaultWorkspace ? 1 : 2, addNewTab);
  },

  async createNoNameWorkspace() {
    await this.createWorkspace("New Workspace", false);
  },

  async addTabToWorkspace(workspaceId, tab) {
    let workspacesData = await this.getCurrentWorkspacesData();
    workspacesData[workspaceId].tabs.push(tab.workspaceId);
    await this.saveWorkspacesData(workspacesData);
  },

  async deleteWorkspace(workspaceId) {
    let windowId = this.getCurrentWindowId();
    await WorkspacesService.deleteWorkspace(workspaceId, windowId);
  },

  async renameWorkspace(workspaceId, newName) {
    let windowId = this.getCurrentWindowId();
    await WorkspacesService.renameWorkspace(workspaceId, newName, windowId);
  },

  async setDefaultWorkspace(workspaceId) {
    let windowId = this.getCurrentWindowId();
    await WorkspacesService.setDefaultWorkspace(workspaceId, windowId);

    // rebuild the workspacesToolbar
    gWorkspaces.rebuildWorkspacesToolbar(windowId);
  },

  changeWorkspace(workspaceId, option) {
    // Change Workspace
    let willChangeWorkspaceLastShowTab =
      gWorkspaces.getWorkspaceselectedTab(workspaceId);

    if (willChangeWorkspaceLastShowTab) {
      gBrowser.selectedTab = willChangeWorkspaceLastShowTab;
    } else {
      let tab = gWorkspaces.createTabForWorkspace(workspaceId);
      gBrowser.selectedTab = tab;
    }

    gWorkspaces.setSelectWorkspace(workspaceId);

    switch (option) {
      case 1:
        // rebuild the workspaces Toolbar
        gWorkspaces.rebuildWorkspacesToolbar();
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
    let windowId = this.getCurrentWindowId();
    let result = await WorkspacesIdUtils.workspaceIdExists(
      workspaceId,
      windowId
    );
    return result;
  },

  async setSelectWorkspace(workspaceId) {
    let windowId = this.getCurrentWindowId();
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

    let tab = gBrowser.addTab(url, {
      skipAnimation: true,
      inBackground: false,
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
    this.setWorkspaceIdToAttribute(tab, workspaceId);
    return tab;
  },

  getWorkspaceFirstTab(workspaceId) {
    for (let tab of gBrowser.tabs) {
      if (tab.getAttribute(this.workspacesTabAttributionId) == workspaceId) {
        return tab;
      }
    }
    return null;
  },

  checkWorkspaceHasTab(workspaceId) {
    let firstTab = this.getWorkspaceFirstTab(workspaceId);
    if (firstTab) {
      return true;
    }
    return false;
  },

  getWorkspaceselectedTab(workspaceId) {
    for (let tab of gBrowser.tabs) {
      if (
        tab.getAttribute(this.workspaceLastShowTabAttributionId) == workspaceId
      ) {
        return tab;
      }
    }
    return null;
  },

  removeWorkspaceTabs(workspaceId) {
    for (let tab of gBrowser.tabs) {
      if (tab.getAttribute(this.workspacesTabAttributionId) == workspaceId) {
        gBrowser.removeTab(tab);
      }
    }
  },

  /* userContext Service */
  async getWorkspaceContainerUserContextId(workspaceId) {
    let windowId = this.getCurrentWindowId();
    let userContextId =
      await WorkspacesIdUtils.getWorkspaceContainerUserContextId(
        workspaceId,
        windowId
      );
    return userContextId;
  },

  async setWorkspaceContainerUserContextId(workspaceId, userContextId) {
    let windowId = this.getCurrentWindowId();
    await WorkspacesService.setWorkspaceContainerUserContextId(
      workspaceId,
      userContextId,
      windowId
    );
  },

  /* Visibility Service */
  async checkAllTabsForVisibility() {
    // Check all tabs for visibility
    // Get Current Workspace & Workspace Id
    // Get Current Window Id

    let windowId = gWorkspaces.getCurrentWindowId();
    // Remove all tab infomation from json
    await WorkspacesIdUtils.removeWindowTabsDataById(windowId);

    let currentWorkspaceId = await gWorkspaces.getCurrentWorkspaceId();
    let workspace = await gWorkspaces.getCurrentWorkspace();
    let workspacesData = await gWorkspaces.getCurrentWorkspacesData();

    // Check all tabs for visibility
    let tabs = gBrowser.tabs;
    for (let i = 0; i < tabs.length; i++) {
      // Set workspaceId if workspaceId is null
      let workspaceId = gWorkspaces.getWorkspaceIdFromAttribute(tabs[i]);
      if (
        !(workspaceId !== "" && workspaceId !== null && workspaceId !== undefined)
      ) {
        gWorkspaces.setWorkspaceIdToAttribute(tabs[i], currentWorkspaceId);
      }

      let chackedWorkspaceId = gWorkspaces.getWorkspaceIdFromAttribute(tabs[i]);
      if (await gWorkspaces.getCurrentWorkspacesCount() > 1) {
        if (chackedWorkspaceId == currentWorkspaceId) {
          gBrowser.showTab(tabs[i]);
        } else {
          gBrowser.hideTab(tabs[i]);
        }
      }

      let tabObj = {
        url: tabs[i].linkedBrowser.currentURI.spec,
        tabId: i,
        userContextId: tabs[i].userContextId ? tabs[i].userContextId : 0,
      };

      // Last tab attribute
      let selectedTab = gBrowser.selectedTab;
      let newWorkspaceId = await gWorkspaces.getCurrentWorkspaceId();
      if (tabs[i] == selectedTab) {
        // Remove Last tab attribute from another tab
        let lastShowTabs = document.querySelectorAll(
          `[${WorkspacesService.workspaceLastShowId}="${newWorkspaceId}"]`
        );
        for (let i = 0; i < lastShowTabs.length; i++) {
          lastShowTabs[i].removeAttribute(WorkspacesService.workspaceLastShowId);
        }

        tabs[i].setAttribute(
          WorkspacesService.workspaceLastShowId,
          newWorkspaceId
        );
        tabObj.lastShow = true;
      }

      // Save Workspaces data
      workspacesData[workspace.id].tabs.push(tabObj);
    }
    // Save Workspaces data
    await gWorkspaces.saveWorkspacesDataWithoutOverwritingPreferences(
      workspacesData
    );

    gWorkspaces._currentWorkspaceId = currentWorkspaceId;
  },

  /* init */
  async init() {
    if (this._initialized) {
      return;
    }

    let currentWorkspace = await gWorkspaces.getCurrentWorkspace();
    if (!currentWorkspace || currentWorkspace == null || currentWorkspace == undefined) {
      await gWorkspaces.createWorkspace("Default", true, false);

      // Set default Workspace
      let workspaceId = await gWorkspaces.getCurrentWorkspaceId();
      await gWorkspaces.setSelectWorkspace(workspaceId);
    }

    async function checkURLChange() {
      await gWorkspaces.checkAllTabsForVisibility();
    }

    // Use internal APIs to detect when the current tab changes.
    setInterval(checkURLChange, 1000);

    let events = ["TabSelect", "TabPinned", "TabUnpinned"];

    for (let event of events) {
      gBrowser.tabContainer.addEventListener(
        event,
        gWorkspaces.checkAllTabsForVisibility
      );
    }

    // Add injection CSS
    let styleElemInjectToToolbar = document.createElement("style");
    styleElemInjectToToolbar.id = "workspacesInjectionCSS";
    styleElemInjectToToolbar.textContent = WorkspacesElementService.injectionCSS;
    document.head.appendChild(styleElemInjectToToolbar);

    // build Workspaces toolbar
    await gWorkspaces.rebuildWorkspacesToolbar();

    // Set current Workspace Id
    this._currentWorkspaceId = await this.getCurrentWorkspaceId();
    this.checkAllTabsForVisibility();

    // Initialized complete
    this._initialized = true;
  },

  eventListeners: {
    async onTabBarStateChanged(reason) {
      // Change Workspaces toolbar visibility
      await gWorkspaces.checkAllTabsForVisibility();
    },
  },

  contextMenu: {
    createWorkspacesContextMenuItems(event) {
      //delete already exsist items
      let menuElem = document.getElementById("workspaces-toolbar-item-context-menu");
      while (menuElem.firstChild) {
        menuElem.firstChild.remove();
      }

      //create context menu
      let menuItem = window.MozXULElement.parseXULToFragment(`
         <menuitem data-l10n-id="workspace-context-menu-selected-tab" disabled="true"/>
        `);
      let parentElem = document.getElementById(
        "workspaces-toolbar-item-context-menu"
      );
      parentElem.appendChild(menuItem);
    },
  },
};

if (gWorkspaces.workspaceEnabled) {
  window.SessionStore.promiseInitialized.then(() => {
    window.setTimeout(() => {
      gWorkspaces.init();
    }, 2000);
  });
}
