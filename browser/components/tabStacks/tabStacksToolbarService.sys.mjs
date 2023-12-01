/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const EXPORTED_SYMBOLS = ["TabStacksToolbarService"];

export const TabStacksToolbarService = {
    toolbarElement:
      `<toolbar id="tabStacksToolbar" toolbarname="tab stacks toolbar" customizable="true" style="border-top: 1px solid var(--chrome-content-separator-color)"
               class="browser-toolbar customization-target" mode="icons" context="toolbar-context-menu" accesskey="A">
                  <hbox id="tabStacksToolbarContent" align="center" flex="1" class="statusbar-padding"/>
      </toolbar>`,

    injectionCSS: `
        .toolbar-items {
          display: flex;
          flex-direction: column;
        }
        #TabsToolbar-customization-target {
          width: 100% !important;
        }
        #tabStacksToolbar {
          width: 100% !important;
        }
        #tabStacksToolbarContent {
          background: inherit !important;
        }
        #tabStacksToolbar {
          background: inherit !important;
        }
     `,
     
     tabStackBlockElement(tabStackId, tabStackName) {
        return `<toolbarbutton id="tabStack-${tabStackId}" class="toolbarbutton-1 chromeclass-toolbar-additional" label="${tabStackName}" tooltiptext="${tabStackName}" oncommand="gTabStack.switchTabStack('${tabStackId}')">
                    <image class="toolbarbutton-icon" src="chrome://browser/skin/tabStack.svg" />
                </toolbarbutton>`;
     }
}
