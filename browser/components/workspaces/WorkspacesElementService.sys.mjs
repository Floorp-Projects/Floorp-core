/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { WorkspacesWindowIdUtils } from "resource:///modules/WorkspacesWindowIdUtils.sys.mjs";

export const EXPORTED_SYMBOLS = ["WorkspacesElementService"];

export const WorkspacesElementService = {
    panelElement:
      `<panel id="workspacesToolbarButtonPanel" type="arrow" position="bottom top" onpopupshowing="gWorkspaces.rebuildWorkspacesToolbar();">
          <vbox id="workspacesToolbarButtonPanelBox">
            <arrowscrollbox id="workspacesPopupBox" flex="1">
                <vbox id="workspacesPopupContent" align="center" flex="1" orient="vertical"
                                clicktoscroll="true" class="statusbar-padding" />
            </arrowscrollbox>
            <toolbarseparator class="toolbarbutton-1 chromeclass-toolbar-additional" id="workspacesPopupSeparator" />
            <hbox id="workspacesPopupFooter" align="center" pack="center">
              <toolbarbutton id="workspacesCreateNewWorkspaceButton" class="toolbarbutton-1 chromeclass-toolbar-additional"
                           label="New Workspace..." tooltiptext="Create new Workspace" context="tab-stacks-toolbar-item-context-menu"
                           oncommand="gWorkspaces.createNoNameWorkspace();" />
              <toolbarbutton id="workspacesManageWorkspacesButton" class="toolbarbutton-1 chromeclass-toolbar-additional"
                           label="Manage Workspaces" tooltiptext="Manage Workspaces" context="tab-stacks-toolbar-item-context-menu"
                           oncommand="gWorkspaces.manageWorkspaceFromDialog();" />
            </hbox>
          </vbox>
        </panel>
        `,

    injectionCSS: `
     `,

     
     workspaceBlockElement(workspaceId, workspaceName, selected) {
        return `<toolbarbutton id="workspace-${workspaceId}" context="workspaces-toolbar-item-context-menu"
                               class="toolbarbutton-1 chromeclass-toolbar-additional workspaceButton"
                               label="${workspaceName}" tooltiptext="Workspace ${workspaceName}"
                               ${selected ? "selected=\"true\"" : ""}
                               oncommand="gWorkspaces.changeWorkspace('${workspaceId}');" />
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
