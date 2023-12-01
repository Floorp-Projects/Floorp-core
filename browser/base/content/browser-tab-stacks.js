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

let gTabStack = {
    _initialized: false,
    _currentWindowId: null,
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
        let tab = gBrowser.selectedTab;
        let windowId = this.getCurrentWindowId();
        let tabStackId = await tabStacksIdUtils.getTabStackIdByTab(tab, windowId);
        if (tabStackId == null) {
            let id = await tabStacksExternalFileService.getDefaultTabStackId(windowId) ;
            let tabStack = await tabStacksIdUtils.getTabStackByIdAndWindowId(id, windowId);
            return tabStack;
        }

        let tabStack = await tabStacksIdUtils.getTabStackByIdAndWindowId(tabStackId, windowId);
        return tabStack;
    },

    async getCurrentTabStackId() {
        let currentTabStack = await this.getCurrentTabStack();
        return currentTabStack.id;
    },

    async getCurrentTabStacksData() {
        let windowId = this.getCurrentWindowId();
        let tabStacksData = await tabStacksExternalFileService.getWindowTabStacksData(windowId);
        return tabStacksData;
    },

    /* tab stacks saver */
    async saveTabStacksData(tabStacksData) {
        let windowId = this.getCurrentWindowId();
        await tabStacksExternalFileService.saveTabStacksData(tabStacksData, windowId);
    },

    /* tab stacks remover */
    async removeTabFromTabStack(tabStackId, tab) {
        let tabStacksData = await this.getCurrentTabStacksData();
        let index = tabStacksData[tabStackId].tabs.indexOf(tab.tabStackId);
        tabStacksData[tabStackId].tabs.splice(index, 1);
        await this.saveTabStacksData(tabStacksData);
    },

    async removeTabStackById(tabStackId) {
        let windowId = this.getCurrentWindowId();
        await tabStacksIdUtils.removeTabStackById(tabStackId, windowId);
    },

    async removeWindowTabStacksDataById() {
        let windowId = this.getCurrentWindowId();
        await tabStacksIdUtils.removeWindowTabStacksDataById(windowId);
    },

    /* tab stacks manager */

    async createTabStack(name, defaultTabStack) {
        let windowId = this.getCurrentWindowId();
        await tabStacksService.createTabStack(name, windowId, defaultTabStack);
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
    },

    async setSelectTabStack(tabStackId) {
        let windowId = this.getCurrentWindowId();
        await tabStacksService.setSelectTabStack(tabStackId, windowId);
    },

    /* init */
    async init() {
        if (this._initialized) {
            return;
        }

        if (!await gTabStack.getCurrentTabStack()) {
            await this.createTabStack("Default", true);

            // Set default tab stack
            let tabStackId = await gTabStack.getCurrentTabStackId();
            await this.setSelectTabStack(tabStackId);
        }

        let count = 0;
        let currentURL = gBrowser.currentURI.spec;
    
        async function checkURLChange() {
          const newURL = gBrowser.currentURI.spec;    
          if (newURL !== currentURL || count < 2) {
            await gTabStack.functions.checkAllTabsForVisibility();
            if (newURL !== currentURL) {
                count = 0;
            }
            currentURL = newURL;
            count++;
          }
        }
    
        // Use internal APIs to detect when the current tab changes.
        setInterval(checkURLChange, 2000);


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

        this._initialized = true;
    },

    eventListeners: {
        async onTabBarStateChanged(reason) {
            // Change tab stacks toolbar visibility
            await gTabStack.functions.checkAllTabsForVisibility();
        }
    },

    functions: {
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
                if (tabs[i].tabStackId == currentTabStackId) {
                    gBrowser.hideTab(tabs[i]);
                } else {
                    gBrowser.showTab(tabs[i]);
                }

                let tabObj = {
                    url: tabs[i].linkedBrowser.currentURI.spec,
                    tabId: i,
                    userContextId: tabs[i].userContextId ? tabs[i].userContextId : 0,
                };
                // Save tab stacks data
                tabStacksData[tabStack.id].tabs.push(tabObj);
            }

            // Save tab stacks data
            await gTabStack.saveTabStacksData(tabStacksData);
        },
    }
}

if (gTabStack.tabStackEnabled) {
    gTabStack.init();
}
