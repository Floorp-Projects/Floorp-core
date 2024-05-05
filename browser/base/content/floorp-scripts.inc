# -*- Mode: Java; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

<script type="text/javascript">

// This ESM has build configuration constants.
var { FloorpAppConstants } = ChromeUtils.importESModule(
    "resource:///modules/FloorpAppConstants.sys.mjs"
);

import("chrome://browser/content/browser-ua-data.mjs");
import("chrome://browser/content/browser-overrides.mjs");

import("chrome://browser/content/browser-commands.mjs").then(({ gFloorpCommands }) => {
    window.gFloorpCommands = gFloorpCommands
});

if (FloorpAppConstants.FLOORP_OFFICIAL_COMPONENTS_ENABLED) {
    import("chrome://browser/content/browser-bms-window.mjs").then(({ gBmsWindow }) => {
        window.gBmsWindow = gBmsWindow
    });
    import("chrome://browser/content/browser-statusbar.mjs").then(({ gFloorpStatusBar }) => {
        window.gFloorpStatusBar = gFloorpStatusBar
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
    import("chrome://browser/content/browser-floorp-pageActions.mjs").then(({ gFloorpPageAction }) => {
        window.gFloorpPageAction = gFloorpPageAction
    });
    import("chrome://browser/content/browser-manager-sidebar.mjs").then(({ gBrowserManagerSidebar }) => {
        window.gBrowserManagerSidebar = gBrowserManagerSidebar
    });
    import("chrome://browser/content/browser-preferences.mjs").then(({ gFloorpPreferences }) => {
        window.gFloorpPreferences = gFloorpPreferences
    });
    import("chrome://browser/content/browser-UI-custom.mjs").then(({ gFloorpObservePreference }) => {
        window.gFloorpObservePreference = gFloorpObservePreference
    });
    import("chrome://browser/content/browser-browserActions.mjs").then(({ gFloorpBrowserActions }) => {
        window.gFloorpBrowserActions = gFloorpBrowserActions
    });
    import("chrome://browser/content/browser-chromeCSS.mjs");

    if (FloorpAppConstants.FLOORP_OFFICIAL_COMPONENTS_ENABLED) {
        import("chrome://browser/content/browser-custom-keyboard-shortcut.mjs").then(
          ({
            gFloorpCustomShortcutKeys,
            gFloorpCustomActionFunctions,
            gFloorpCSKActionFunctions,
          }) => {
            window.gFloorpCustomShortcutKeys = gFloorpCustomShortcutKeys;
            window.gFloorpCustomActionFunctions = gFloorpCustomActionFunctions;
            window.gFloorpCSKActionFunctions = gFloorpCSKActionFunctions;
          }
        );
        import("chrome://browser/content/browser-favicon-color.mjs").then(({ gFloorpFaviconColor }) => {
            window.gFloorpFaviconColor = gFloorpFaviconColor
        });
        import("chrome://browser/content/browser-splitView.mjs").then(({ gSplitView }) => {
            window.gSplitView = gSplitView
        });
        import("chrome://browser/content/browser-private-container.mjs").then(({ gFloorpPrivateContainer }) => {
            window.gFloorpPrivateContainer = gFloorpPrivateContainer
        });
    }

    // If script need more delay, use the following code.
    window.SessionStore.promiseInitialized.then(() => {
        import("chrome://browser/content/browser-downloadbar.mjs").then(({ gFloorpLegacyStyleDownloadBar }) => {
            window.gFloorpLegacyStyleDownloadBar = gFloorpLegacyStyleDownloadBar
        });
        import("chrome://browser/content/browser-pinned-tabs-title.mjs").then(({ gFloorpPinnedTabsTitle }) => {
            window.gFloorpPinnedTabsTitle = gFloorpPinnedTabsTitle
        });
        import("chrome://browser/content/browser-ssb-support.mjs").then(({ gSsbSupport }) => {
            window.gSsbSupport = gSsbSupport
        });
        import("chrome://browser/content/browser-tabbar.mjs").then(({ gFloorpTabBarStyle }) => {
            window.gFloorpTabBarStyle = gFloorpTabBarStyle
        })
        import("chrome://browser/content/browser-design.mjs").then(({ gFloorpDesign }) => {
            window.gFloorpDesign = gFloorpDesign
        })
        import("chrome://browser/content/browser-verticaltabs.mjs").then(({ gFloorpVerticalTabBar }) => {
            window.gFloorpVerticalTabBar = gFloorpVerticalTabBar
        })
        import("chrome://browser/content/browser-flex-order.mjs").then(({ gFloorpFlexOrder }) => {
            window.gFloorpFlexOrder = gFloorpFlexOrder
        })
        import("chrome://browser/content/browser-share-mode.mjs").then(({ gFloorpShareMode }) => {
            window.gFloorpShareMode = gFloorpShareMode
        });

        if (FloorpAppConstants.FLOORP_OFFICIAL_COMPONENTS_ENABLED) {
            import("chrome://browser/content/browser-UI-customizing-menu.mjs").then(({ gFloorpCustomizeMode }) => {
                window.gFloorpCustomizeMode = gFloorpCustomizeMode
            });
            import("chrome://browser/content/browser-workspaces.mjs").then(({ gWorkspaces }) => {
                window.gWorkspaces = gWorkspaces
            });
        }
    });
}, { once: true });
</script>
