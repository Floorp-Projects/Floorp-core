/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* SplitView is a feature that provides show a tab on the left or right side of the window. */

const gSplitView = {
  Functions: {
    init() {
      gSplitView.Functions.tabContextMenu.addContextMenuToTabContext();
      Services.prefs.setBoolPref("floorp.browser.splitView.working", false);
    },
    setSplitView(tab, side) {
      try {
        this.removeSplitView();
      } catch (e) {}
      Services.prefs.setBoolPref("floorp.browser.splitView.working", true);

      const panel = gSplitView.Functions.getlinkedPanel(tab.linkedPanel);
      const browser = tab.linkedBrowser;
      let browserRenderLayers = browser.renderLayers;
      const browserDocShellIsActiveState = browser.docShellIsActive;

      // Check if the a tab is already in split view
      const tabs = window.gBrowser.tabs;
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].hasAttribute("splitView")) {
          gSplitView.Functions.removeSplitView(tabs[i]);
        }
      }

      const CSSElem = document.getElementById("splitViewCSS");
      if (!CSSElem) {
        const elem = document.createElement("style");
        elem.setAttribute("id", "splitViewCSS");
        elem.textContent = `
        #tabbrowser-tabpanels > * {
          flex: 0;
        }
        
        .deck-selected {
          flex: 1 !important;
          order: 1 !important;
        }
        
        .deck-selected[splitview="right"] {
          order: 3 !important;
        }
        
        .deck-selected[splitview="left"] {
          order: 0 !important;
        }
        
        #tabbrowser-tabpanels {
          display: flex !important;
        }
        `;
        document.head.appendChild(elem);
      }

      tab.setAttribute("splitView", true);
      panel.setAttribute("splitview", side);
      panel.setAttribute("splitviewtab", true);
      panel.classList.add("deck-selected");
      browserRenderLayers = true;

      if (!browserDocShellIsActiveState) {
        browser.docShellIsActive = true;
      }

      gSplitView.Functions.setRenderLayersEvent();
    },

    removeSplitView() {
      Services.prefs.setBoolPref("floorp.browser.splitView.working", false);

      const tab = document.querySelector(`.tabbrowser-tab[splitView="true"]`);

      if (!tab) {
        return;
      }

      // remove style
      const panel = gSplitView.Functions.getlinkedPanel(tab.linkedPanel);
      const CSSElem = document.getElementById("splitViewCSS");
      CSSElem?.remove();

      tab.removeAttribute("splitView");
      panel.removeAttribute("splitview");
      panel.removeAttribute("splitviewtab");
      panel.classList.remove("deck-selected");
      browserRenderLayers = false;

      if (browser.docShellIsActive) {
        browser.docShellIsActive = false;
      }

      gSplitView.Functions.removeRenderLayersEvent();

      // set renderLayers to true & Set class to deck-selected
      window.gBrowser.selectedTab = tab;
    },

    getlinkedPanel(id) {
      const panel = document.getElementById(id);
      return panel;
    },

    setRenderLayersEvent() {
      window.gBrowser.tabContainer.addEventListener(
        "TabOpen",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.addEventListener(
        "TabClose",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.addEventListener(
        "TabMove",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.addEventListener(
        "TabSelect",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.addEventListener(
        "TabAttrModified",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "TabHide",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "TabShow",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "TabPinned",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "TabUnpinned",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "transitionend",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "dblclick",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "click",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "click",
        gSplitView.Functions.handleTabEvent,
        true
      );

      window.gBrowser.tabContainer.addEventListener(
        "keydown",
        gSplitView.Functions.handleTabEvent,
        { mozSystemGroup: true }
      );

      window.gBrowser.tabContainer.addEventListener(
        "dragstart",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "dragover",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "drop",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "dragend",
        gSplitView.Functions.handleTabEvent
      );

      window.gBrowser.tabContainer.addEventListener(
        "dragleave",
        gSplitView.Functions.handleTabEvent
      );
    },

    removeRenderLayersEvent() {
      window.gBrowser.tabContainer.removeEventListener(
        "TabOpen",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "TabClose",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "TabMove",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "TabSelect",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "TabAttrModified",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "TabHide",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "TabShow",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "TabPinned",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "TabUnpinned",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "transitionend",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "dblclick",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "click",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "click",
        gSplitView.Functions.handleTabEvent,
        true
      );
      window.gBrowser.tabContainer.removeEventListener(
        "keydown",
        gSplitView.Functions.handleTabEvent,
        { mozSystemGroup: true }
      );
      window.gBrowser.tabContainer.removeEventListener(
        "dragstart",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "dragover",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "drop",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "dragend",
        gSplitView.Functions.handleTabEvent
      );
      window.gBrowser.tabContainer.removeEventListener(
        "dragleave",
        gSplitView.Functions.handleTabEvent
      );
    },

    handleTabEvent() {
      if (!Services.prefs.getBoolPref("floorp.browser.splitView.working")) {
        return;
      }

      const currentSplitViewTab = document.querySelector(
        `.tabbrowser-tab[splitView="true"]`
      );
      const currentSplitViewPanel = gSplitView.Functions.getlinkedPanel(
        currentSplitViewTab?.linkedPanel
      );
      const currentSplitViewBrowser = currentSplitViewTab?.linkedBrowser;

      if (!currentSplitViewBrowser) {
        return;
      }

      // set renderLayers to true & Set class to deck-selected
      currentSplitViewBrowser.renderLayers = true;
      currentSplitViewPanel?.classList.add("deck-selected");

      if (!currentSplitViewBrowser.docShellIsActive) {
        currentSplitViewBrowser.docShellIsActive = true;
      }

      function applySplitView() {
        currentSplitViewBrowser.renderLayers = true;
        currentSplitViewPanel?.classList.add("deck-selected");

        if (!browser.docShellIsActive) {
          browser.docShellIsActive = true;
        }
      }

      (function modifyDeckSelectedClass() {
        const tabs = window.gBrowser.tabs;
        for (let i = 0; i < tabs.length; i++) {
          const panel = gSplitView.Functions.getlinkedPanel(
            tabs[i].linkedPanel
          );
          if (
            tabs[i].hasAttribute("splitView") ||
            tabs[i] == window.gBrowser.selectedTab
          ) {
            panel?.classList.add("deck-selected");
          } else {
            panel?.classList.remove("deck-selected");
          }
        }
      })();

      window.setTimeout(applySplitView, 1000);
    },

    tabContextMenu: {
      addContextMenuToTabContext() {
        const beforeElem = document.getElementById("context_selectAllTabs");
        const menuitemElem = window.MozXULElement.parseXULToFragment(`
               <menu id="context_splitView" data-l10n-id="floorp-split-view-menu" accesskey="D">
                   <menupopup id="splitViewTabContextMenu"
                              onpopupshowing="gSplitView.Functions.tabContextMenu.onPopupShowing(event);"/>
               </menu>
               <menuitem id="splitViewTabContextMenuClose" data-l10n-id="splitview-close-split-tab"  oncommand="gSplitView.Functions.removeSplitView();"/>
               `);
        beforeElem.before(menuitemElem);
      },

      onPopupShowing(event) {
        //delete already exsist items
        const menuElem = document.getElementById("splitViewTabContextMenu");
        while (menuElem.firstChild) {
          menuElem.firstChild.remove();
        }

        //Rebuild context menu
        if (event.target == window.gBrowser.selectedTab) {
          const menuItem = window.MozXULElement.parseXULToFragment(`
                   <menuitem data-l10n-id="workspace-context-menu-selected-tab" disabled="true"/>
                  `);
          const parentElem = document.getElementById("workspaceTabContextMenu");
          parentElem.appendChild(menuItem);
          return;
        }

        const menuItem = window.MozXULElement.parseXULToFragment(`
                  <menuitem id="splitViewTabContextMenuLeft" data-l10n-id="splitview-show-on-left"  oncommand="gSplitView.Functions.setSplitView(TabContextMenu.contextTab, 'left');"/>
                  <menuitem id="splitViewTabContextMenuRight" data-l10n-id="splitview-show-on-right" oncommand="gSplitView.Functions.setSplitView(TabContextMenu.contextTab, 'right');"/>
                `);

        const parentElem = document.getElementById("splitViewTabContextMenu");
        parentElem.appendChild(menuItem);
      },

      setSplitView(event, side) {
        const tab = event.target;
        gSplitView.Functions.setSplitView(tab, side);
      },
    },
  },
};

// Init
gSplitView.Functions.init();
