/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { WorkspacesWindowIdUtils } from "resource:///modules/WorkspacesWindowIdUtils.sys.mjs";

export const EXPORTED_SYMBOLS = ["WorkspacesElementService"];

export const WorkspacesElementService = {
    panelElement:
      `<panel id="workspacesToolbarButtonPanel" type="arrow" position="bottom top">
          <vbox id="workspacesToolbarButtonPanelBox">
            <arrowscrollbox id="workspacesPopupBox" flex="1">
                <vbox id="workspacesPopupContent" align="center" flex="1" orient="vertical"
                                clicktoscroll="true" class="statusbar-padding" />
            </arrowscrollbox>
            <toolbarseparator class="toolbarbutton-1 chromeclass-toolbar-additional" id="workspacesPopupSeparator" />
            <hbox id="workspacesPopupFooter" align="center" pack="center">
              <toolbarbutton id="workspacesCreateNewWorkspaceButton" class="toolbarbutton-1 chromeclass-toolbar-additional"
                           label="New Workspace..." tooltiptext="Create new Workspace"
                           oncommand="gWorkspaces.createNoNameWorkspace();" />
              <toolbarbutton id="workspacesManageWorkspacesButton" class="toolbarbutton-1 chromeclass-toolbar-additional"
                           label="Manage Workspaces" tooltiptext="Manage Workspaces"
                           oncommand="WorkspacesService.openWorkspacesManager();" />
            </hbox>
          </vbox>
        </panel>
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
        #workspacesToolbar {
          width: 100% !important;
        }
        #workspacesPopupContent {
          background: inherit !important;
          overflow: scroll;
          max-height: 300px;
          width: 300px;
          padding: 0px 5px;
          scroll-behavior: smooth;
          scrollbar-width: thin;
        }
        #workspacesToolbar {
          background: inherit !important;
        }
        .workspaceButton label,
        .workspaceButton image {
          display: inherit !important;
          background-color: unset !important;
          color: var(--tab-text-color) !important;
        }
        .workspaceButton[selected="true"] {
          background-color: var(--win-hover-bgcolor) !important;
          box-shadow: 0 0 4px rgba(0,0,0,.4);
        }
        .workspaceButton {
          list-style-image: url("chrome://branding/content/icon32.png");
          border-radius: var(--tab-border-radius);
          margin-right: 5px !important;
          width: -moz-available;
          min-height: 40px;
        }
        #workspacesManageWorkspacesButton {
          list-style-image: url("chrome://browser/skin/settings.svg");
        }
        #workspaces-toolbar-button {
          list-style-image: url("chrome://browser/skin/workspace-floorp.png");
          border-radius: 0px !important;
        }
        #workspaces-toolbar-button:hover {
          background-color: var(--toolbarbutton-hover-background) !important;
        }
        #workspaces-toolbar-button[open="true"],
        #workspaces-toolbar-button:hover:active {
          background-color: var(--toolbarbutton-active-background) !important;
        }
        #workspaces-toolbar-button > label {
          display: inherit !important;
        }
        #workspaces-toolbar-button > * {
          background-color: unset !important;
          background-image: unset !important;
          background: unset !important;
        }
        .workspaceSeparator {
          margin: 5px 0px !important;
          width: -moz-available;
        }
        #workspacesCreateNewWorkspaceButton {
          list-style-image: url(chrome://global/skin/icons/plus.svg);
          width: -moz-available;
          border-radius: var(--tab-border-radius);
        }
        #workspacesCreateNewWorkspaceButton:hover {
          background-color: var(--toolbarbutton-hover-background) !important;
        }
        #workspacesCreateNewWorkspaceButton:hover:active {
          background-color: var(--toolbarbutton-active-background) !important;
        }
        #workspacesCreateNewWorkspaceButton > * {
          background-color: unset !important;
          background-image: unset !important;
          background: unset !important;
        }
        #workspacesCreateNewWorkspaceButton > label {
          display: inherit;
        }
        #workspacesPopupSeparator {
          margin: 10px 0px !important;
        }
     `,

     
     workspaceBlockElement(workspaceId, workspaceName, selected) {
        return `<toolbarbutton id="workspace-${workspaceId}" context="tab-stacks-toolbar-item-context-menu"
                               class="toolbarbutton-1 chromeclass-toolbar-additional workspaceButton"
                               label="${workspaceName}" tooltiptext="Workspace ${workspaceName}"
                               ${selected ? "selected=\"true\"" : ""}
                               oncommand="gWorkspaces.changeWorkspace('${workspaceId}');" />
                <toolbarseparator class="toolbarbutton-1 chromeclass-toolbar-additional workspaceSeparator" />
               `
     },

     async getWorkspaceBlockElement(workspaceId, windowId) {
        let workspacesData = await WorkspacesWindowIdUtils.getWindowWorkspacesDataWithoutPreferences(windowId);
        let workspace = workspacesData[workspaceId];
        let selectedWorkspaceId = await WorkspacesWindowIdUtils.getSelectedWorkspaceId(windowId);
        let selected = workspaceId == selectedWorkspaceId;
        return this.workspaceBlockElement(workspaceId, workspace.name, selected);
     },

     async getAllWorkspacesBlockElements(windowId) {
        let workspacesData = await WorkspacesWindowIdUtils.getWindowWorkspacesDataWithoutPreferences(windowId);
        let selectedWorkspaceId = await WorkspacesWindowIdUtils.getSelectedWorkspaceId(windowId);

        let workspaceBlockElements = [];
        for (let workspaceId in workspacesData) {
            let workspace = workspacesData[workspaceId];
            let selected = workspaceId == selectedWorkspaceId;
            workspaceBlockElements.push(this.workspaceBlockElement(workspaceId, workspace.name, selected));
        }
        return workspaceBlockElements;
     }
}
