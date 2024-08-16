/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */

import { BrowserManagerSidebar } from "chrome://floorp/content/modules/bms/BrowserManagerSidebar.mjs";

export const EXPORTED_SYMBOLS = ["BrowserManagerSidebarPanelWindowUtils"];

export const BrowserManagerSidebarPanelWindowUtils = {
  get STATIC_SIDEBAR_DATA() {
    return BrowserManagerSidebar.STATIC_SIDEBAR_DATA;
  },

  get BROWSER_SIDEBAR_DATA() {
    return JSON.parse(
      Services.prefs.getStringPref("floorp.browser.sidebar2.data", undefined)
    );
  },

  getWindowByWebpanelId(webpanelId, parentWindow) {
    const webpanelBrowserId = "webpanel" + webpanelId;
    const webpanelBrowser =
      parentWindow.document.getElementById(webpanelBrowserId);

    if (!webpanelBrowser) {
      return null;
    }

    return webpanelBrowser.browsingContext.associatedWindow;
  },

  toggleMutePanel(aWindow, webpanelId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, window);
    } else {
      targetPanelWindow = window;
    }

    if (!targetPanelWindow) {
      return;
    }

    const tab = targetPanelWindow.gBrowser.selectedTab;
    const audioMuted = tab.linkedBrowser.audioMuted;

    if (audioMuted) {
      tab.linkedBrowser.unmute();
    } else {
      tab.linkedBrowser.mute();
    }
  },

  reloadPanel(aWindow, webpanelId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, aWindow);
    } else {
      targetPanelWindow = aWindow;
    }

    if (!targetPanelWindow) {
      return;
    }

    const tab = targetPanelWindow.gBrowser.selectedTab;
    tab.linkedBrowser.reload();
  },

  goForwardPanel(aWindow, webpanelId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, aWindow);
    } else {
      targetPanelWindow = aWindow;
    }

    if (!targetPanelWindow) {
      return;
    }

    const tab = targetPanelWindow.gBrowser.selectedTab;
    tab.linkedBrowser.goForward();
  },

  goBackPanel(aWindow, webpanelId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, aWindow);
    } else {
      targetPanelWindow = aWindow;
    }

    if (!targetPanelWindow) {
      return;
    }

    const tab = targetPanelWindow.gBrowser.selectedTab;
    tab.linkedBrowser.goBack();
  },

  goIndexPagePanel(aWindow, webpanelId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, aWindow);
    } else {
      targetPanelWindow = aWindow;
    }

    if (!targetPanelWindow) {
      return;
    }

    const uri = targetPanelWindow.bmsLoadedURI;
    targetPanelWindow.gBrowser.loadURI(Services.io.newURI(uri), {
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
  },

  reopenInSelectContainer(aWindow, webpanelId, userContextId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, aWindow);
    } else {
      targetPanelWindow = aWindow;
    }

    if (!targetPanelWindow) {
      return;
    }

    const targetTab = targetPanelWindow.gBrowser.selectedTab;
    const targetBrowser = targetTab.linkedBrowser;
    targetBrowser.setAttribute("usercontextid", userContextId);
    setTimeout(() => {
      targetBrowser.reload();
    }, 500);
  },

  saveZoomLevel(webpanelId, zoomLevel) {
    const currentBSMData = this.BROWSER_SIDEBAR_DATA;
    currentBSMData.data[webpanelId].zoomLevel = zoomLevel;
    Services.prefs.setStringPref(
      "floorp.browser.sidebar2.data",
      JSON.stringify(currentBSMData)
    );
  },

  zoomInPanel(aWindow, webpanelId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, window);
    } else {
      targetPanelWindow = window;
    }

    if (!targetPanelWindow) {
      return;
    }

    targetPanelWindow.ZoomManager.enlarge();

    const zoomLevel = targetPanelWindow.ZoomManager.zoom;
    this.saveZoomLevel(webpanelId, zoomLevel);
  },

  zoomOutPanel(aWindow, webpanelId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, window);
    } else {
      targetPanelWindow = window;
    }

    if (!targetPanelWindow) {
      return;
    }

    targetPanelWindow.ZoomManager.reduce();

    const zoomLevel = targetPanelWindow.ZoomManager.zoom;
    this.saveZoomLevel(webpanelId, zoomLevel);
  },

  resetZoomPanel(aWindow, webpanelId, isParentWindow) {
    let targetPanelWindow = null;

    if (isParentWindow) {
      targetPanelWindow = this.getWindowByWebpanelId(webpanelId, window);
    } else {
      targetPanelWindow = window;
    }

    if (!targetPanelWindow) {
      return;
    }

    targetPanelWindow.ZoomManager.zoom = 1;

    const zoomLevel = targetPanelWindow.ZoomManager.zoom;
    this.saveZoomLevel(webpanelId, zoomLevel);
  },
};
