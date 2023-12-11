/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { tabStacksWindowIdUtils } from "resource:///modules/tabStacksWindowIdUtils.sys.mjs";

export const EXPORTED_SYMBOLS = ["TabStacksToolbarService"];

export const TabStacksToolbarService = {
    toolbarElement:
      `<toolbar id="tabStacksToolbar" toolbarname="tab stacks toolbar" customizable="true"
                class="browser-toolbar customization-target" mode="icons" context="toolbar-context-menu" accesskey="A">
                <arrowscrollbox id="tabStacksToolbarContent" align="center" flex="1" orient="horizontal"
                                class="statusbar-padding" />
                <toolbarbutton id="tabStacksCreateNewTabStackButton" class="toolbarbutton-1 chromeclass-toolbar-additional"
                               label="Create new tab stack" tooltiptext="Create new tab stack"
                               oncommand="gTabStack.createNoNameTabStack();" />
                <toolbarbutton id="tabStacksManageTabStacksButton" class="toolbarbutton-1 chromeclass-toolbar-additional"
                               label="Manage tab stacks" tooltiptext="Manage tab stacks"
                               oncommand="tabStacksService.openTabStacksManager();" />
                <hbox class="titlebar-buttonbox-container" skipintoolbarset="true">
                      <hbox class="titlebar-buttonbox titlebar-color">
                            <toolbarbutton class="titlebar-button titlebar-min" oncommand="window.minimize();"
                                           data-l10n-id="browser-window-minimize-button" />
                            <toolbarbutton class="titlebar-button titlebar-max" oncommand="window.maximize();"
                                           data-l10n-id="browser-window-maximize-button"/>
                            <toolbarbutton class="titlebar-button titlebar-restore"
                                           oncommand="window.fullScreen ? BrowserFullScreen() : window.restore();"
                                           data-l10n-id="browser-window-restore-down-button"/>
                            <toolbarbutton class="titlebar-button titlebar-close" command="cmd_closeWindow"
                                           data-l10n-id="browser-window-close-button" oncommand="BrowserTryToCloseWindow(event)"/>
                      </hbox>
                </hbox>
        </toolbar>
        `,

    injectionCSS: `
        #TabsToolbar .toolbar-items {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        #TabsToolbar-customization-target {
          width: 100% !important;
        }
        #tabStacksToolbar {
          width: 100% !important;
        }
        #tabStacksToolbarContent {
          background: inherit !important;
          height: var(--tab-min-height) !important;
          overflow: scroll;
        }
        #tabStacksToolbar {
          background: inherit !important;
        }
        .tabStackButton label,
        .tabStackButton image {
          display: inherit !important;
          background-color: unset !important;
          color: var(--tab-text-color) !important;
        }
        .tabStackButton[selected="true"] {
          background-color: var(--tab-selected-bgcolor, var(--toolbar-bgcolor));
          box-shadow: 0 0 4px rgba(0,0,0,.4);
        }
        .tabStackButton {
          list-style-image: url("chrome://branding/content/icon32.png");
          border-radius: var(--tab-border-radius);
          margin-right: 5px !important;
        }
        #tabStacksCreateNewTabStackButton {
          list-style-image: url(chrome://global/skin/icons/plus.svg);
        }
        #tabStacksManageTabStacksButton {
          list-style-image: url("chrome://browser/skin/settings.svg");
        }
     `,
     
     tabStackBlockElement(tabStackId, tabStackName, selected) {
        return `<toolbarbutton id="tabStack-${tabStackId}" context="tab-stacks-toolbar-item-context-menu"
                               class="toolbarbutton-1 chromeclass-toolbar-additional tabStackButton"
                               label="${tabStackName}" tooltiptext="TabStack ${tabStackName}"
                               ${selected ? "selected=\"true\"" : ""}
                               oncommand="gTabStack.changeTabStack('${tabStackId}');" />
               `
     },

     async getAllTabStacksBlockElements(windowId) {
        let tabStacksData = await tabStacksWindowIdUtils.getWindowTabStacksDataWithoutPreferences(windowId);
        let selectedTabStackId = await tabStacksWindowIdUtils.getSelectedTabStackId(windowId);

        let tabStackBlockElements = [];
        for (let tabStackId in tabStacksData) {
            let tabStack = tabStacksData[tabStackId];
            let selected = tabStackId == selectedTabStackId;
            tabStackBlockElements.push(this.tabStackBlockElement(tabStackId, tabStack.name, selected));
        }
        return tabStackBlockElements;
     }
}
