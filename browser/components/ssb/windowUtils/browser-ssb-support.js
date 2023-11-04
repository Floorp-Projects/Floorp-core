/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var { SiteSpecificBrowserIdUtils } = ChromeUtils.import("resource:///modules/SiteSpecificBrowserIdUtils.jsm");

let gSsbSupport = {
  _initialized: false,

  get TabsToolbar() {
    return document.getElementById("TabsToolbar");
  },

  get panelUIBUtton() {
    return document.getElementById("PanelUI-menu-button");
  },

  get navToolbar() {
    return document.getElementById("nav-bar");
  },

  get TabsToolbarWindowControls() {
    return document.querySelector("#TabsToolbar .titlebar-buttonbox-container");
  },

  get pageActionBox() {
    return document.getElementById("page-action-buttons");
  },

  get identityBox() {
    return document.getElementById("identity-box");
  },


  init() {
    let styleElement = document.createElement("style");
    styleElement.id = "ssb-support";
    styleElement.textContent = `@import url("chrome://browser/content/browser-ssb-support.css");`;
    document.head.appendChild(styleElement);

    this.navToolbar.append(this.TabsToolbarWindowControls);
    this.identityBox.after(this.pageActionBox);

    gBrowser.tabs.forEach(tab => {
      tab.setAttribute("floorpSSB", "true");
    });
    
    this._initialized = true;
  }
}

gSsbSupport.init();
