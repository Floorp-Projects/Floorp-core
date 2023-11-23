/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

const VERTICAL_TABS_WIDTH_PREF = "floorp.browser.tabs.verticaltab.width";

function setWorkspaceLabel() {
  const workspaceButton = document.getElementById("workspace-button");
  const customizeTarget = document.getElementById(
    "nav-bar-customization-target"
  );

  if (!workspaceButton) {
    return;
  }

  customizeTarget.before(workspaceButton);
}

function checkBrowserIsStartup() {
  const browserWindows = Services.wm.getEnumerator("navigator:browser");

  while (browserWindows.hasMoreElements()) {
    if (browserWindows.getNext() !== window) {
      return;
    }
  }

  SessionStore.promiseInitialized.then(() => {
    window.setTimeout(setWorkspaceLabel, 1500);
    window.setTimeout(setWorkspaceLabel, 3000);
  });
}

function toggleCustomizeModeVerticaltabStyle() {
  let customizationContainer = document.getElementById("nav-bar");
  let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.target.getAttribute("customizing") == "true") {
        Services.prefs.setBoolPref(
          "floorp.browser.tabs.verticaltab.temporary.disabled",
          true
        );
        Services.prefs.setIntPref("floorp.tabbar.style", 0);
        Services.prefs.setIntPref(tabbarContents.tabbarDisplayStylePref, 0);
      } else {
        Services.prefs.setBoolPref(
          "floorp.browser.tabs.verticaltab.temporary.disabled",
          false
        );
        Services.prefs.setIntPref("floorp.tabbar.style", 2);
        Services.prefs.setIntPref(tabbarContents.tabbarDisplayStylePref, 2);
      }
    });
  });
  let config = { attributes: true };
  observer.observe(customizationContainer, config);

  Services.prefs.addObserver("floorp.tabbar.style", function () {
    if (
      Services.prefs.getIntPref("floorp.tabbar.style") != 2 &&
      !Services.prefs.getBoolPref(
        "floorp.browser.tabs.verticaltab.temporary.disabled"
      )
    ) {
      observer.disconnect();
    } else if (
      Services.prefs.getIntPref("floorp.tabbar.style") == 2 &&
      Services.prefs.getBoolPref(
        "floorp.browser.tabs.verticaltab.temporary.disabled"
      )
    ) {
      observer.observe(customizationContainer, config);
    }
  });
}

function mutationObserverCallback(mutations) {
  const tabsToolbar = document.getElementById("TabsToolbar");

  for (const mutation of mutations) {
    if (mutation.type === "attributes" && mutation.attributeName == "width") {
      Services.prefs.setIntPref(
        VERTICAL_TABS_WIDTH_PREF,
        parseInt(tabsToolbar?.getAttribute("width") || "100")
      );
    }
  }
}

function toggleVerticalTabsPositionHandler() {
  let verticaltabPositionPref = Services.prefs.getBoolPref(
    "floorp.browser.tabs.verticaltab.right"
  );

  if (!verticaltabPositionPref) {
    document.getElementById("TabsToolbar")?.setAttribute("positionend", "true");
  } else {
    document.getElementById("TabsToolbar")?.removeAttribute("positionend");
  }
}

function setVerticalTabs() {
  if (Services.prefs.getIntPref("floorp.tabbar.style") == 2) {
    Services.prefs.setBoolPref("floorp.browser.tabs.verticaltab", true);

    // Re-implement the vertical tab bar v2. This is a temporary solution cannot close tab correctly.
    // Vertical tab bar has to position at the  first of child the "browser" elem.
    document
      .getElementById("browser")
      .prepend(document.getElementById("TabsToolbar"));

    document
      .getElementById("tabbrowser-arrowscrollbox")
      .setAttribute("orient", "vertical");
    document
      .getElementById("tabbrowser-tabs")
      .setAttribute("orient", "vertical");
    document.getElementById("TabsToolbar").setAttribute("multibar", "true");

    document
      .getElementsByClassName("toolbar-items")[0]
      .setAttribute("align", "start");

    document.getElementById("TabsToolbar").removeAttribute("flex");
    document.getElementById("TabsToolbar").removeAttribute("hidden");
    document.getElementById("TabsToolbar").style.width = "350px";

    checkBrowserIsStartup();

    //toolbar modification
    let Tag = document.createElement("style");
    Tag.id = "verticalTabsStyle";
    Tag.textContent = `@import url("chrome://browser/content/browser-verticaltabs.css");`;
    document.head.appendChild(Tag);

    Services.prefs.setIntPref("floorp.browser.tabbar.settings", 2);

    if (
      document.getElementById("floorp-vthover") == null &&
      Services.prefs.getBoolPref("floorp.verticaltab.hover.enabled")
    ) {
      Tag = document.createElement("style");
      Tag.innerText = `@import url(chrome://browser/skin/options/native-verticaltab-hover.css)`;
      Tag.setAttribute("id", "floorp-vthover");
      document.head.appendChild(Tag);
    }
    //add context menu
    let target = document.getElementById("TabsToolbar-customization-target");
    target.setAttribute("context", "toolbar-context-menu");

    //splitter
    document.getElementById("verticaltab-splitter").removeAttribute("hidden");

    // Observer
    toggleCustomizeModeVerticaltabStyle();

    widthObserver = new MutationObserver(mutationObserverCallback);

    if (document.getElementById("TabsToolbar")) {
      widthObserver.observe(document.getElementById("TabsToolbar"), {
        attributes: true,
      });
    }

    document
      .getElementById("TabsToolbar")
      ?.setAttribute(
        "width",
        Services.prefs.getIntPref(VERTICAL_TABS_WIDTH_PREF, 200)
      );

    if (document.getElementById("TabsToolbar")) {
      document.getElementById(
        "TabsToolbar"
      ).style.width = `${Services.prefs.getIntPref(
        VERTICAL_TABS_WIDTH_PREF,
        200
      )}px`;
    }

    // Modify the tab bar
    window.setTimeout(() => {
      if (
        document
          .querySelector("#browser #TabsToolbar")
          ?.getAttribute("hidden") != "true"
      ) {
        document
          .getElementById("browser")
          .prepend(document.getElementById("TabsToolbar"));
        document.getElementById("TabsToolbar").removeAttribute("hidden");
      }

      let scroolbarPref = "floorp.verticaltab.show.scrollbar";
      if (
        Services.prefs.getBoolPref(scroolbarPref)
      ) {
        let arrowscrollbox = document.getElementById("tabbrowser-arrowscrollbox");
        let elem = arrowscrollbox.shadowRoot.createElementAndAppendChildAt(
          arrowscrollbox.shadowRoot.querySelector(".scrollbox-clip"),
          "style"
        );
        elem.textContent = `scrollbox[part="scrollbox"] {
          overflow-y: scroll;
        }`;
        elem.setAttribute("class", "floorp-vtscrollbar");
      }
    }, 1000);
  } else {
    // TODO: Re-implement the vertical tab bar. This code is not working.
    document
      .getElementById("titlebar")
      .prepend(document.getElementById("TabsToolbar"));

    // Remove CSS
    document.getElementById("verticalTabsStyle")?.remove();
    document.getElementById("floorp-vthover")?.remove();

    document
      .getElementById("tabbrowser-arrowscrollbox")
      .setAttribute("orient", "horizontal");
    document
      .getElementById("tabbrowser-tabs")
      .setAttribute("orient", "horizontal");

    document
      .querySelector("#TabsToolbar .toolbar-items")
      ?.setAttribute("align", "end");

    document.getElementById("TabsToolbar").setAttribute("flex", "1");
    // Reset the resize value, or else the tabs will end up squished
    document.getElementById("TabsToolbar").style.width = "";

    // Pref
    Services.prefs.setBoolPref("floorp.browser.tabs.verticaltab", false);
  }
}

setVerticalTabs();

Services.prefs.addObserver("floorp.tabbar.style", function () {
  if (Services.prefs.getIntPref("floorp.tabbar.style") == 2) {
    Services.prefs.setIntPref(tabbarContents.tabbarDisplayStylePref, 2);
  } else {
    Services.prefs.setIntPref(tabbarContents.tabbarDisplayStylePref, 0);
  }
  setVerticalTabs();
});
