/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { CustomizableUI } = ChromeUtils.importESModule(
  "resource:///modules/CustomizableUI.sys.mjs"
);

/**
 * Object representing the browser actions for the Floorp features.
 * If you search Workspaces's toolbar button, You can find it below path.
 * path: Floorp-private-components/browser/base/content/browser-workspaces.mjs
 *
 * @type {object}
 * @property {boolean} _initialized - Indicates whether the browser actions have been initialized.
 * @property {Function} init - Initializes the browser actions.
 * @property {Function} createUndoCloseTabButton - Creates the undo close tab button.
 * @property {Function} createSwitchSidebarPositionButton - Creates the switch sidebar position button.
 * @property {Function} createProfileManagerButton - Creates the profile manager button.
 */
const gFloorpBrowserActions = {
  _initialized: false,

  init() {
    if (this._initialized) {
      return;
    }

    this.createUndoCloseTabButton();
    this.createSwitchSidebarPositionButton();
    this._initialized = true;
  },

  async _createToolbarButton(widgetId, l10nId, onCommand, type = "button") {
    const widget = CustomizableUI.getWidget(widgetId);
    if (widget && widget.type !== "custom") {
      return;
    }
    const l10n = new Localization(["browser/floorp.ftl"]);
    const l10nText = await l10n.formatValue(l10nId);
    CustomizableUI.createWidget({
      id: widgetId,
      type,
      label: l10nText,
      tooltiptext: l10nText,
      onCommand() {
        Function(onCommand)();
      },
      onCreated(aNode) {
        const fragment = window.MozXULElement.parseXULToFragment(
          `<stack xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" class="toolbarbutton-badge-stack">
            <image class="toolbarbutton-icon" data-l10n-id="${l10nId}" />
            <html:label xmlns:html="http://www.w3.org/1999/xhtml" class="toolbarbutton-badge" />
           </stack>`
        );
        aNode.appendChild(fragment);
      },
    });
  },

  async createUndoCloseTabButton() {
    await this._createToolbarButton(
      "undo-closed-tab",
      "undo-closed-tab",
      "undoCloseTab();",
      "button"
    ).then(() => {
      if (
        ChromeUtils.importESModule("resource:///modules/FloorpStartup.sys.mjs")
          .isFirstRun
      ) {
        CustomizableUI.addWidgetToArea(
          widgetId,
          CustomizableUI.AREA_NAVBAR,
          -1
        );
      }
    });
  },

  async createSwitchSidebarPositionButton() {
    await this._createToolbarButton(
      "sidebar-reverse-position-toolbar",
      "sidebar-reverse-position-toolbar",
      "SidebarUI.reversePosition();",
      "button"
    ).then(() => {
      if (
        ChromeUtils.importESModule("resource:///modules/FloorpStartup.sys.mjs")
          .isFirstRun
      ) {
        CustomizableUI.addWidgetToArea(
          "sidebar-button",
          CustomizableUI.AREA_NAVBAR,
          3
        );
        CustomizableUI.addWidgetToArea(widgetId, CustomizableUI.AREA_NAVBAR, 4);
      }
    });
  },

  async createProfileManagerButton() {
    if (!Services.prefs.getBoolPref("floorp.browser.profile-manager.enabled")) {
      return;
    }

    await this._createToolbarButton(
      "profile-manager",
      "floorp-profile-manager",
      `(async () => {
        const popup = document.getElementById("profile-manager-popup");
        popup.openPopup(
          document.getElementById("profile-manager-popup"),
          "after_start",
          0,
          0,
          false,
          false
        );
      })();`,
      "button"
    );
  },
};

gFloorpBrowserActions.init();
