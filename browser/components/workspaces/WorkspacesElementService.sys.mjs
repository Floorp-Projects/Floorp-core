/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { workspacesWindowIdUtils } from "resource:///modules/workspacesWindowIdUtils.sys.mjs";

export const EXPORTED_SYMBOLS = ["WorkspacesElementService"];

export const WorkspacesElementService = {
    panelElement:
      `<panel id="workspacesToolbarButtonPanel" type="arrow" position="bottomright topright">
          <arrowscrollbox id="workspacesPopupBox" flex="1">
              <vbox id="workspacesPopupContent" align="center" flex="1" orient="vertical"
                              clicktoscroll="true" class="statusbar-padding" />
              <toolbarbutton id="workspacesCreateNewWorkspaceButton" class="toolbarbutton-1 chromeclass-toolbar-additional"
                             label="Create new Workspace" tooltiptext="Create new Workspace"
                             oncommand="gWorkspaces.createNoNameWorkspace();" />
              <toolbarbutton id="workspacesManageWorkspacesButton" class="toolbarbutton-1 chromeclass-toolbar-additional"
                             label="Manage Workspaces" tooltiptext="Manage Workspaces"
                             oncommand="workspacesService.openWorkspacesManager();" />
          </arrowscrollbox>
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
        #workspacesCreateNewWorkspaceButton {
          list-style-image: url(chrome://global/skin/icons/plus.svg);
        }
        #workspacesManageWorkspacesButton {
          list-style-image: url("chrome://browser/skin/settings.svg");
        }
     `,

     
     workspaceBlockElement(workspaceId, workspaceName, selected) {
        return `<toolbarbutton id="workspace-${workspaceId}" context="tab-stacks-toolbar-item-context-menu"
                               class="toolbarbutton-1 chromeclass-toolbar-additional workspaceButton"
                               label="${workspaceName}" tooltiptext="Workspace ${workspaceName}"
                               ${selected ? "selected=\"true\"" : ""}
                               oncommand="gWorkspaces.changeWorkspace('${workspaceId}');" />
               `
     },

     async getWorkspaceBlockElement(workspaceId, windowId) {
        let workspacesData = await workspacesWindowIdUtils.getWindowWorkspacesDataWithoutPreferences(windowId);
        let workspace = workspacesData[workspaceId];
        let selectedWorkspaceId = await workspacesWindowIdUtils.getSelectedWorkspaceId(windowId);
        let selected = workspaceId == selectedWorkspaceId;
        return this.workspaceBlockElement(workspaceId, workspace.name, selected);
     },

     async getAllWorkspacesBlockElements(windowId) {
        let workspacesData = await workspacesWindowIdUtils.getWindowWorkspacesDataWithoutPreferences(windowId);
        let selectedWorkspaceId = await workspacesWindowIdUtils.getSelectedWorkspaceId(windowId);

        let workspaceBlockElements = [];
        for (let workspaceId in workspacesData) {
            let workspace = workspacesData[workspaceId];
            let selected = workspaceId == selectedWorkspaceId;
            workspaceBlockElements.push(this.workspaceBlockElement(workspaceId, workspace.name, selected));
        }
        return workspaceBlockElements;
     }
}
