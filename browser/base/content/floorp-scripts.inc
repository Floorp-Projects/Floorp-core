# -*- Mode: Java; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

<script type="text/javascript">
// This ESM has build configuration constants.
var { FloorpAppConstants } = ChromeUtils.importESModule(
    "resource:///modules/FloorpAppConstants.sys.mjs"
);

import("chrome://browser/content/browser-commands.mjs").then(({ gFloorpCommands }) => {
    window.gFloorpCommands = gFloorpCommands
});

// TODO: MIGRATE TO ESM
Services.scriptloader.loadSubScript("chrome://browser/content/browser-overrides.js", this);

if (FloorpAppConstants.FLOORP_OFFICIAL_COMPONENTS_ENABLED) {
    import("chrome://browser/content/browser-workspaces.mjs").then(({ gWorkspaces }) => {
        window.gWorkspaces = gWorkspaces
    });
    import("chrome://browser/content/browser-bms-window.mjs").then(({ gBmsWindow }) => {
        window.gBmsWindow = gBmsWindow
    });
}

// This function is called when the floorp browser window is loaded. needs Delay.
document.addEventListener("DOMContentLoaded", () => {
    import("chrome://browser/content/browser-context-menu.mjs").then(({ gFloorpContextMenu }) => {
        window.gFloorpContextMenu = gFloorpContextMenu
    });
    import("chrome://browser/content/browser-onlocation-change.mjs").then(({ gFloorpOnLocationChange }) => {
        window.gFloorpOnLocationChange = gFloorpOnLocationChange
    });
    import("chrome://browser/content/browser-pageActions-floorp.mjs").then(({ gFloorpPageAction }) => {
        window.gFloorpPageAction = gFloorpPageAction
    });
    import("chrome://browser/content/browser-manager-sidebar.mjs").then(({ gBrowserManagerSidebar }) => {
        window.gBrowserManagerSidebar = gBrowserManagerSidebar
    });

    Services.scriptloader.loadSubScript("chrome://browser/content/browser-preferences.js", this);
    Services.scriptloader.loadSubScript("chrome://browser/content/browser-downloadbar.js", this);
    Services.scriptloader.loadSubScript("chrome://browser/content/browser-UI-custom.js", this);
    Services.scriptloader.loadSubScript("chrome://browser/content/browser-browserActions.js", this);
    Services.scriptloader.loadSubScript("chrome://browser/content/browser-pinned-tabs-title.js", this);

    // TODO: MIGRATE TO ESM after the other scripts are migrated to ESM
    Services.scriptloader.loadSubScript("chrome://browser/content/browser-chromeCSS.js", this);

    if (FloorpAppConstants.FLOORP_OFFICIAL_COMPONENTS_ENABLED) {
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-custom-keyboard-shortcut.js", this);
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-favicon-color.js", this);
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-splitView.js", this);
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-statusbar.js", this);
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-private-container.js", this);
    }

    // If script need more delay, use the following code.
    window.SessionStore.promiseInitialized.then(() => {
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-ssb-manager.js", this);
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-tabbar.js", this);
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-design.js", this);
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-verticaltabs.js", this);
        Services.scriptloader.loadSubScript("chrome://browser/content/browser-flex-order.js", this);

        import("chrome://browser/content/browser-share-mode.mjs").then(({ gFloorpShareMode }) => {
            window.gFloorpShareMode = gFloorpShareMode
        });

        if (FloorpAppConstants.FLOORP_OFFICIAL_COMPONENTS_ENABLED) {
            Services.scriptloader.loadSubScript("chrome://browser/content/browser-UI-customizing-menu.js", this);
        }
    });
}, { once: true });
</script>
