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

export const gFloorpBrowserActions = {
  _initialized: false,

  init() {
    if (this._initialized) {
      return;
    }

    this.createUndoCloseTabButton();
    this.createSwitchSidebarPositionButton();
    this.createProfileManagerButton();
    this._initialized = true;
  },

  async _createToolbarButton(widgetId, l10nId, onCommand) {
    const widget = CustomizableUI.getWidget(widgetId);
    if (widget && widget.type !== "custom") {
      return;
    }
    const l10n = new Localization(["browser/floorp.ftl"]);
    const l10nText = await l10n.formatValue(l10nId);
    CustomizableUI.createWidget({
      id: widgetId,
      type: "button",
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

  async _createToolbarButtonTypeMenu(
    widgetId,
    popupElem,
    popupStyle,
    l10nId,
    onCommand
  ) {
    const widget = CustomizableUI.getWidget(widgetId);
    if (widget && widget.type !== "custom") {
      return;
    }
    const l10n = new Localization(["browser/floorp.ftl"]);
    const l10nText = await l10n.formatValue(l10nId);
    CustomizableUI.createWidget({
      id: widgetId,
      type: "button",
      label: l10nText,
      tooltiptext: l10nText,
      onCommand() {
        Function(onCommand)();
      },
      onCreated(aNode) {
        aNode.setAttribute("type", "menu");
        const popup = window.MozXULElement.parseXULToFragment(popupElem);
        aNode.style = popupStyle;
        aNode.appendChild(popup);
      },
    });
  },

  async createUndoCloseTabButton() {
    await this._createToolbarButton(
      "undo-closed-tab",
      "undo-closed-tab",
      "undoCloseTab();"
    ).then(() => {
      if (
        ChromeUtils.importESModule("resource:///modules/FloorpStartup.sys.mjs")
          .isFirstRun
      ) {
        CustomizableUI.addWidgetToArea(
          "sidebar-button",
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
      "SidebarUI.reversePosition();"
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
        CustomizableUI.addWidgetToArea("sidebar-reverse-position-toolbar", CustomizableUI.AREA_NAVBAR, 4);
      }
    });
  },

  async createProfileManagerButton() {
    if (!Services.prefs.getBoolPref("floorp.browser.profile-manager.enabled")) {
      return;
    }

    await this._createToolbarButtonTypeMenu(
      "profile-manager",
      `<menupopup id="profile-manager-popup" position="after_start" style="--panel-padding: 0 !important;">
        <browser id="profile-switcher-browser" src="chrome://browser/content/profile-manager/profile-switcher.xhtml"
                 flex="1" type="content" disablehistory="true" disableglobalhistory="true" context="profile-popup-contextmenu" />
       </menupopup>
      `,
      "--panel-padding: 0 !important;",
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
      })();`
    );
  },
};

gFloorpBrowserActions.init();
