/* eslint-disable no-undef */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

Preferences.addAll([
  { id: "enable.floorp.update", type: "bool" },
  { id: "ui.systemUsesDarkTheme", type: "int" },
  { id: "floorp.search.top.mode", type: "bool" },
  { id: "floorp.enable.auto.restart", type: "bool" },
  { id: "toolkit.tabbox.switchByScrolling", type: "bool" },
  { id: "browser.tabs.closeTabByDblclick", type: "bool" },
  { id: "floorp.disable.fullscreen.notification", type: "bool" },
  { id: "floorp.tabsleep.enabled", type: "bool" },
  { id: "floorp.tabs.showPinnedTabsTitle", type: "bool" },
  { id: "floorp.openLinkInExternal.enabled", type: "bool" },
  { id: "floorp.openLinkInExternal.browserId", type: "string" },
  { id: "floorp.browser.tabs.openNewTabPosition", type: "int" },
  { id: "services.sync.prefs.sync.floorp.browser.note.memos", type: "bool" },
  { id: "floorp.browser.workspace.tab.enabled", type: "bool" },
  { id: "floorp.tabscroll.reverse", type: "bool" },
  { id: "floorp.tabscroll.wrap", type: "bool" },
  { id: "floorp.portable.isUpdate", type: "bool" },
]);

window.addEventListener(
  "pageshow",
  async function () {
    await gMainPane.initialized;
    const needreboot = document.getElementsByClassName("needreboot");
    for (let i = 0; i < needreboot.length; i++) {
      if (needreboot[i].getAttribute("rebootELIsSet") == "true") {
        continue;
      }
      needreboot[i].setAttribute("rebootELIsSet", "true");
      needreboot[i].addEventListener("click", function () {
        if (!Services.prefs.getBoolPref("floorp.enable.auto.restart", false)) {
          (async () => {
            let userConfirm = await confirmRestartPrompt(null);
            if (userConfirm == CONFIRM_RESTART_PROMPT_RESTART_NOW) {
              Services.startup.quit(
                Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart
              );
            }
          })();
        } else {
          window.setTimeout(function () {
            Services.startup.quit(
              Services.startup.eAttemptQuit | Services.startup.eRestart
            );
          }, 500);
        }
      });
    }

    {
      let prefName = "browser.tabs.tabMinWidth";
      let elem = document.getElementById("tabWidthValue");
      elem.value = Services.prefs.getIntPref(prefName, undefined);
      elem.addEventListener("change", function () {
        Services.prefs.setIntPref(prefName, Number(elem.value));
      });
      Services.prefs.addObserver(prefName, function () {
        elem.value = Services.prefs.getIntPref(prefName, undefined);
      });
    }

    {
      let prefName = "floorp.browser.tabs.tabMinHeight";
      let elem = document.getElementById("tabHeightValue");
      elem.value = Services.prefs.getIntPref(prefName, undefined);
      elem.addEventListener("change", function () {
        Services.prefs.setIntPref(prefName, Number(elem.value));
      });
      Services.prefs.addObserver(prefName, function () {
        elem.value = Services.prefs.getIntPref(prefName, undefined);
      });
    }

    document
      .getElementById("backUpNotesOption")
      .addEventListener("click", function () {
        window.location.href = "about:preferences#notes";
      });

    document
      .getElementById("userjsOptionsButton")
      .addEventListener("click", function () {
        window.location.href = "about:preferences#userjs";
      });

    document
      .getElementById("TabSleepSettings")
      .addEventListener("click", function () {
        gSubDialog.open(
          "chrome://floorp/content/preferences/dialogs/tabsleep.xhtml",
          undefined,
          undefined
        );
      });

    const addonStatus = async (addonID, idName) => {
      const addon = await AddonManager.getAddonByID(addonID);
      if (addon !== null) {
        document.getElementById(idName).style.display = "none";
      }
    };
    addonStatus("{506e023c-7f2b-40a3-8066-bc5deb40aebe}", "aboutMouseGesture");
    addonStatus("{036a55b4-5e72-4d05-a06c-cba2dfcc134a}", "TWS-box");

    Services.prefs.addObserver("toolkit.tabbox.switchByScrolling", function () {
      let isEnabled = Services.prefs.getBoolPref(
        "toolkit.tabbox.switchByScrolling"
      );
      let tabscrollReverse = document.querySelector(
        '[preference="floorp.tabscroll.reverse"]'
      );
      let tabscrollWrap = document.querySelector(
        '[preference="floorp.tabscroll.wrap"]'
      );
      if (isEnabled) {
        tabscrollReverse.removeAttribute("disabled");
        tabscrollWrap.removeAttribute("disabled");
      } else {
        tabscrollReverse.setAttribute("disabled", "true");
        tabscrollWrap.setAttribute("disabled", "true");
      }
    });

    {
      const basePrefName = "extensions.checkCompatibility";
      const isNightlyPref = !["aurora", "beta", "release", "esr"].includes(
        AppConstants.MOZ_UPDATE_CHANNEL
      );
      const appVersion = Services.appinfo.version.replace(
        /^([^\.]+\.[0-9]+[a-z]*).*/gi,
        "$1"
      );
      const appVersionMajor = appVersion.replace(
        /^([^\.]+)\.[0-9]+[a-z]*/gi,
        "$1"
      );
      const prefNameNightly = `${basePrefName}.nightly`;
      const prefNameVersion = `${basePrefName}.${appVersion}`;
      const prefName = isNightlyPref ? prefNameNightly : prefNameVersion;
      let elem = document.getElementById("disableExtensionCheckCompatibility");
      elem.checked = !Services.prefs.getBoolPref(prefName, true);
      elem.addEventListener("command", function () {
        Services.prefs.setBoolPref(prefNameNightly, !elem.checked);
        for (let minor = 0; minor <= 15; minor++) {
          Services.prefs.setBoolPref(
            `${basePrefName}.${appVersionMajor}.${minor}`,
            !elem.checked
          );
        }
      });
      Services.prefs.addObserver(prefName, function () {
        elem.checked = !Services.prefs.getBoolPref(prefName, true);
      });
    }

    if (Services.prefs.getBoolPref("floorp.isPortable", false)) {
      document
        .getElementById("floorpPortableUpdateAuto")
        .removeAttribute("hidden");
      document
        .getElementById("floorpPortableUpdateHeader")
        .removeAttribute("hidden");
    }

    // Version Injections
    let versionElem = document.getElementById("updateAppInfo");
    let versionElemL10nArgs = JSON.parse(
      versionElem.getAttribute("data-l10n-args")
    );
    let floorpVersion = versionElemL10nArgs.version;
    let firefoxInsideVersion = Services.appinfo.version;

    let injectedObj = {
      version: `${floorpVersion} | Firefox: ${firefoxInsideVersion}`,
    };

    versionElem.setAttribute("data-l10n-args", JSON.stringify(injectedObj));
  },
  { once: true }
);

// Optimize for portable version
if (Services.prefs.getBoolPref("floorp.isPortable", false)) {
  // https://searchfox.org/mozilla-esr102/source/browser/components/preferences/main.js#1306-1311
  getShellService = function () {};

  const portableCSSElem = document.createElement("style");
  portableCSSElem.id = "portableCSS";
  portableCSSElem.innerText = `
  #updateDeck {
    display: none;
  }

  #showUpdateHistory {
    display: none;
  }
  
  #updateSettingsContainer {
    display: none;
  }

  #updateAllowDescription {
    display: none;
  }
  `;
  document.head.appendChild(portableCSSElem);
}
