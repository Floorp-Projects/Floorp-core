/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let { tabStacksExternalFileService } = ChromeUtils.importESModule(
  "resource:///modules/tabStacksExternalFileService.sys.mjs"
);

let { tabStacksService } = ChromeUtils.importESModule(
  "resource:///modules/tabStacksService.sys.mjs"
);

let { tabStacksPreferences } = ChromeUtils.importESModule(
  "resource:///modules/tabStacksService.sys.mjs"
);

let { tabStacksIdUtils } = ChromeUtils.importESModule(
  "resource:///modules/tabStacksIdUtils.sys.mjs"
);

let { TabStacksToolbarService } = ChromeUtils.importESModule(
  "resource:///modules/tabStacksToolbarService.sys.mjs"
);

let { tabStacksWindowIdUtils } = ChromeUtils.importESModule(
  "resource:///modules/tabStacksWindowIdUtils.sys.mjs"
);

let { tabStacksDataSaver } = ChromeUtils.importESModule(
  "resource:///modules/tabStacksDataSaver.sys.mjs"
);

// global variable
var gBrowser = window.gBrowser;

const gTabStack = {
  _initialized: false,
  _currentTabStackId: null,

  /** Elements */
  get titlebar() {
    return document.getElementById("titlebar");
  },

  get TabsToolbar() {
    return document.getElementById("TabsToolbar");
  },

  get tabStacksToolbar() {
    return document.getElementById("tabStacksToolbar");
  },

  get tabStacksToolbarContent() {
    return document.getElementById("tabStacksToolbarContent");
  },

  get arrowscrollbox() {
    return document.getElementById("tabbrowser-arrowscrollbox");
  },

  get TabsToolbartoolbarItems() {
    return document.querySelector("#TabsToolbar .toolbar-items");
  },

  get tabStackButtons() {
    return document.querySelectorAll(".tabStackButton");
  },

  /** Tab Stacks Toolbar */
  async rebuildTabStacksToolbar() {
    // Remove all tab stacks toolbar
    while (gTabStack.tabStackButtons.length) {
      gTabStack.tabStacksToolbarContent.firstChild.remove();
    }

    // Add all tab stacks toolbar
    let tabStackBlockElements = await gTabStack.getAllTabStacksBlockElements();
    for (let tabStackBlockElement of tabStackBlockElements) {
      let tabStackBlockElementFragment =
        window.MozXULElement.parseXULToFragment(tabStackBlockElement);
      gTabStack.tabStacksToolbarContent.appendChild(
        tabStackBlockElementFragment
      );
    }
  },

  async addToolbarTabStackButtonToAppend(tabStackId) {
    let toolbarTabStackButton = await this.getTabStackBlockElement(
      tabStackId
    );
    let toolbarTabStackButtonFragment =
      window.MozXULElement.parseXULToFragment(toolbarTabStackButton);
    this.tabStacksToolbarContent.appendChild(toolbarTabStackButtonFragment);
  },

  async changeToolbarSelectedTabStackView(tabStackId) {
    let selectedTabStackToolbarButton = document.querySelector(
      `.tabStackButton[selected="true"]`
    );

    if (selectedTabStackToolbarButton) {
      selectedTabStackToolbarButton.removeAttribute("selected");
    }

    let tabStackToolbarButton = document.getElementById(
      `tabStack-${tabStackId}`
    );

    if (tabStackToolbarButton) {
      tabStackToolbarButton.setAttribute("selected", true);
    }
  },

  /* Preferences */
  get tabStackEnabled() {
    return Services.prefs.getBoolPref(
      tabStacksPreferences.TAB_STACKS_ENABLED_PREF,
      false
    );
  },

  /* get tab stacks infomation */
  getCurrentWindowId() {
    let windowId = window.windowGlobalChild.outerWindowId;
    return windowId;
  },

  async getCurrentTabStack() {
    let windowId = this.getCurrentWindowId();
    let tabStackId = await tabStacksWindowIdUtils.getSelectedTabStackId(
      windowId
    );

    if (tabStackId == null) {
      let id = await tabStacksWindowIdUtils.getDefaultTabStackId(windowId);
      let tabStack = await tabStacksIdUtils.getTabStackByIdAndWindowId(
        id,
        windowId
      );
      return tabStack;
    }

    let tabStack = await tabStacksIdUtils.getTabStackByIdAndWindowId(
      tabStackId,
      windowId
    );
    return tabStack;
  },

  async getCurrentTabStackId() {
    let currentTabStack = await this.getCurrentTabStack();
    return currentTabStack.id;
  },

  async getCurrentTabStacksData() {
    let windowId = this.getCurrentWindowId();
    let tabStacksData = await tabStacksWindowIdUtils.getWindowTabStacksData(
      windowId
    );
    return tabStacksData;
  },

  async getAllTabStacksBlockElements() {
    let windowId = this.getCurrentWindowId();
    let result = await TabStacksToolbarService.getAllTabStacksBlockElements(
      windowId
    );
    return result;
  },

  async getTabStackBlockElement(tabStackId) {
    let windowId = this.getCurrentWindowId();
    let result = await TabStacksToolbarService.getTabStackBlockElement(
      tabStackId,
      windowId
    );
    return result;
  },

  /* tab stacks saver */
  async saveTabStacksData(tabStacksData) {
    let windowId = this.getCurrentWindowId();
    await tabStacksDataSaver.saveTabStacksData(tabStacksData, windowId);
  },

  async saveTabStacksDataWithoutOverwritingPreferences(tabStacksData) {
    let windowId = this.getCurrentWindowId();
    await tabStacksDataSaver.saveTabStacksDataWithoutOverwritingPreferences(
      tabStacksData,
      windowId
    );
  },

  async saveWindowPreferences(preferences) {
    let windowId = this.getCurrentWindowId();
    await tabStacksDataSaver.saveWindowPreferences(preferences, windowId);
  },

  /* tab attribute */
  getTabStackIdFromAttribute(tab) {
    let tabStackId = tab.getAttribute(this.tabStacksTabAttributionId);
    return tabStackId;
  },

  setTabStackIdToAttribute(tab, tabStackId) {
    tab.setAttribute(this.tabStacksTabAttributionId, tabStackId);
  },

  /* tab stacks remover */
  async removeTabFromTabStack(tabStackId, tab) {
    let tabStacksData = await this.getCurrentTabStacksData();
    let index = tabStacksData[tabStackId].tabs.indexOf(
      tab.getAttribute(this.tabStacksTabAttributionId)
    );
    tabStacksData[tabStackId].tabs.splice(index, 1);
    await this.saveTabStacksData(tabStacksData);
  },

  async removeTabStackById(tabStackId) {
    let windowId = this.getCurrentWindowId();
    await tabStacksIdUtils.removeTabStackById(tabStackId, windowId);
    this.removeTabStackTabs(tabStackId);
  },

  async removeWindowTabStacksDataById() {
    let windowId = this.getCurrentWindowId();
    await tabStacksIdUtils.removeWindowTabStacksDataById(windowId);
  },

  /* tab stacks manager */
  async createTabStack(name, defaultTabStack) {
    let windowId = this.getCurrentWindowId();
    let createdTabStackId = await tabStacksService.createTabStack(name, windowId, defaultTabStack);
    this.changeTabStack(createdTabStackId, defaultTabStack ? 1 : 2);
  },

  async createNoNameTabStack() {
    await this.createTabStack("New Tab Stack", false);
  },

  async addTabToTabStack(tabStackId, tab) {
    let tabStacksData = await this.getCurrentTabStacksData();
    tabStacksData[tabStackId].tabs.push(tab.tabStackId);
    await this.saveTabStacksData(tabStacksData);
  },

  async deleteTabStack(tabStackId) {
    let windowId = this.getCurrentWindowId();
    await tabStacksService.deleteTabStack(tabStackId, windowId);
  },

  async renameTabStack(tabStackId, newName) {
    let windowId = this.getCurrentWindowId();
    await tabStacksService.renameTabStack(tabStackId, newName, windowId);
  },

  async setDefaultTabStack(tabStackId) {
    let windowId = this.getCurrentWindowId();
    await tabStacksService.setDefaultTabStack(tabStackId, windowId);

    // rebuild the tabStacksToolbar
    gTabStack.rebuildTabStacksToolbar(windowId);
  },

  changeTabStack(tabStackId, option) {
    // Change tab stack
    let willChangeTabStackLastShowTab =
      gTabStack.getTabStackSelectedTab(tabStackId);

    if (willChangeTabStackLastShowTab) {
      gBrowser.selectedTab = willChangeTabStackLastShowTab;
    } else {
      let tab = gTabStack.createTabForTabStack(tabStackId);
      gBrowser.selectedTab = tab;
    }

    gTabStack.setSelectTabStack(tabStackId);

    switch (option) {
      case 1:
        // rebuild the tabStacksToolbar
        gTabStack.rebuildTabStacksToolbar();
        break;
      case 2:
        // Append Tab Stacks Toolbar Tab Stack Button
        gTabStack.addToolbarTabStackButtonToAppend(tabStackId);
        gTabStack.changeToolbarSelectedTabStackView(tabStackId);
        break;
      default:
        // Change Tab Stacks Toolbar Selected Tab Stack View
        gTabStack.changeToolbarSelectedTabStackView(tabStackId);
        break;
    }
    gTabStack.checkAllTabsForVisibility();
  },

  async setSelectTabStack(tabStackId) {
    let windowId = this.getCurrentWindowId();
    await tabStacksService.setSelectTabStack(tabStackId, windowId);
  },

  /* tab manager */
  get tabStacksTabAttributionId() {
    return tabStacksService.tabStacksTabAttributionId;
  },

  get tabStackLastShowTabAttributionId() {
    return tabStacksService.tabStackLastShowId;
  },

  moveTabToTabStack(tabStackId, tab) {
    this.setTabStackIdToAttribute(tab, tabStackId);
    if (tab === gBrowser.selectedTab) {
      gTabStack.changeTabStack(tabStackId);
    } else {
      gTabStack.checkAllTabsForVisibility();
    }
  },

  createTabForTabStack(tabStackId, url) {
    if (!url) {
      url = Services.prefs.getStringPref("browser.startup.homepage");
    }

    let tab = gBrowser.addTab(url, {
      skipAnimation: true,
      inBackground: false,
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
    this.setTabStackIdToAttribute(tab, tabStackId);
    return tab;
  },

  getTabStackFirstTab(tabStackId) {
    for (let tab of gBrowser.tabs) {
      if (tab.getAttribute(this.tabStacksTabAttributionId) == tabStackId) {
        return tab;
      }
    }
    return null;
  },

  checkTabStackHasTab(tabStackId) {
    let firstTab = this.getTabStackFirstTab(tabStackId);
    if (firstTab) {
      return true;
    }
    return false;
  },

  getTabStackSelectedTab(tabStackId) {
    for (let tab of gBrowser.tabs) {
      if (
        tab.getAttribute(this.tabStackLastShowTabAttributionId) == tabStackId
      ) {
        return tab;
      }
    }
    return null;
  },

  removeTabStackTabs(tabStackId) {
    for (let tab of gBrowser.tabs) {
      if (tab.getAttribute(this.tabStacksTabAttributionId) == tabStackId) {
        gBrowser.removeTab(tab);
      }
    }
  },

  /* userContext Service */
  async getTabStackContainerUserContextId(tabStackId) {
    let windowId = this.getCurrentWindowId();
    let userContextId =
      await tabStacksIdUtils.getTabStackContainerUserContextId(
        tabStackId,
        windowId
      );
    return userContextId;
  },

  async setTabStackContainerUserContextId(tabStackId, userContextId) {
    let windowId = this.getCurrentWindowId();
    await tabStacksService.setTabStackContainerUserContextId(
      tabStackId,
      userContextId,
      windowId
    );
  },

  /* Visibility Service */
  async checkAllTabsForVisibility() {
    // Check all tabs for visibility
    // Get Current Tab Stack & Tab Stack Id
    // Get Current Window Id

    let windowId = gTabStack.getCurrentWindowId();
    // Remove all tab infomation from json
    await tabStacksIdUtils.removeWindowTabsDataById(windowId);

    let currentTabStackId = await gTabStack.getCurrentTabStackId();
    let tabStack = await gTabStack.getCurrentTabStack();
    let tabStacksData = await gTabStack.getCurrentTabStacksData();

    // Check all tabs for visibility
    let tabs = gBrowser.tabs;
    for (let i = 0; i < tabs.length; i++) {
      // Set tabStackId if tabStackId is null
      let tabStackId = gTabStack.getTabStackIdFromAttribute(tabs[i]);
      if (
        !(tabStackId !== "" && tabStackId !== null && tabStackId !== undefined)
      ) {
        gTabStack.setTabStackIdToAttribute(tabs[i], currentTabStackId);
      }

      let chackedTabStackId = gTabStack.getTabStackIdFromAttribute(tabs[i]);
      if (chackedTabStackId == currentTabStackId) {
        gBrowser.showTab(tabs[i]);
      } else {
        gBrowser.hideTab(tabs[i]);
      }

      let tabObj = {
        url: tabs[i].linkedBrowser.currentURI.spec,
        tabId: i,
        userContextId: tabs[i].userContextId ? tabs[i].userContextId : 0,
      };

      // Last tab attribute
      let selectedTab = gBrowser.selectedTab;
      let newTabStackId = await gTabStack.getCurrentTabStackId();
      if (tabs[i] == selectedTab) {
        // Remove Last tab attribute from another tab
        let lastShowTabs = document.querySelectorAll(
          `[${tabStacksService.tabStackLastShowId}="${newTabStackId}"]`
        );
        for (let i = 0; i < lastShowTabs.length; i++) {
          lastShowTabs[i].removeAttribute(tabStacksService.tabStackLastShowId);
        }

        tabs[i].setAttribute(
          tabStacksService.tabStackLastShowId,
          newTabStackId
        );
        tabObj.lastShow = true;
      }

      // Save tab stacks data
      tabStacksData[tabStack.id].tabs.push(tabObj);
    }
    // Save tab stacks data
    await gTabStack.saveTabStacksDataWithoutOverwritingPreferences(
      tabStacksData
    );

    gTabStack._currentTabStackId = currentTabStackId;
  },

  /* init */
  async init() {
    if (this._initialized) {
      return;
    }

    let currentTabStack = await gTabStack.getCurrentTabStack();
    if (!currentTabStack) {
      await gTabStack.createTabStack("Default", true);

      // Set default tab stack
      let tabStackId = await gTabStack.getCurrentTabStackId();
      await gTabStack.setSelectTabStack(tabStackId);
    }

    async function checkURLChange() {
      await gTabStack.checkAllTabsForVisibility();
    }

    // Use internal APIs to detect when the current tab changes.
    setInterval(checkURLChange, 1000);

    let events = ["TabSelect", "TabPinned", "TabUnpinned"];

    for (let event of events) {
      gBrowser.tabContainer.addEventListener(
        event,
        gTabStack.checkAllTabsForVisibility
      );
    }

    // init tab stacks toolbar
    let toolbarElement = window.MozXULElement.parseXULToFragment(
      TabStacksToolbarService.toolbarElement
    );
    this.TabsToolbartoolbarItems.prepend(toolbarElement);

    // Add injection CSS
    let styleElement = document.createElement("style");
    styleElement.id = "tabStacksToolbarInjectionCSS";
    styleElement.textContent = TabStacksToolbarService.injectionCSS;
    document.head.appendChild(styleElement);

    // build tab stacks toolbar
    await gTabStack.rebuildTabStacksToolbar();
    this._currentTabStackId = await gTabStack.getCurrentTabStackId();
    gTabStack.checkAllTabsForVisibility();

    // Initialized complete
    this._initialized = true;
  },

  eventListeners: {
    async onTabBarStateChanged(reason) {
      // Change tab stacks toolbar visibility
      await gTabStack.checkAllTabsForVisibility();
    },
  },

  contextMenu: {
    createTabStacksContextMenuItems(event) {
      //delete already exsist items
      let menuElem = document.getElementById("tab-stacks-toolbar-item-context");
      while (menuElem.firstChild) {
        menuElem.firstChild.remove();
      }

      //create context menu
      let menuItem = window.MozXULElement.parseXULToFragment(`
         <menuitem data-l10n-id="workspace-context-menu-selected-tab" disabled="true"/>
        `);
      let parentElem = document.getElementById("tab-stacks-toolbar-item-context");
      parentElem.appendChild(menuItem);
    },
  },
};

if (gTabStack.tabStackEnabled) {
  gTabStack.init();
}
