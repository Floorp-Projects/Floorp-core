var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { k as zCSKCommands, z as zCSKData, b as checkIsSystemShortcut, h as commands, c as createSignal, a as createEffect, d as createElement, s as setProp, j as effect, i as insertNode, g as insert, r as render, e as createComponent } from "./assets/utils.js";
const _CustomShortcutKey = class _CustomShortcutKey {
  constructor() {
    //this boolean disable shortcut of csk
    //useful for registering
    __publicField(this, "disable_csk", false);
    __publicField(this, "cskData", {});
    this.initCSKData();
    console.warn("CSK Init Completed");
  }
  static getInstance() {
    if (!_CustomShortcutKey.instance) {
      _CustomShortcutKey.instance = new _CustomShortcutKey();
    }
    if (!_CustomShortcutKey.windows.includes(window)) {
      _CustomShortcutKey.instance.startHandleShortcut(window);
      _CustomShortcutKey.windows.push(window);
      console.log("add window");
    }
    Services.obs.addObserver(_CustomShortcutKey.instance, "nora-csk");
    return _CustomShortcutKey.instance;
  }
  //@ts-ignore
  observe(_subj, _topic, data) {
    const d = zCSKCommands.safeParse(JSON.parse(data));
    if (d.success) {
      switch (d.data.type) {
        case "disable-csk": {
          this.disable_csk = d.data.data;
          break;
        }
        case "update-pref": {
          this.initCSKData();
          console.log(this.cskData);
          break;
        }
      }
    }
  }
  initCSKData() {
    this.cskData = zCSKData.parse(
      JSON.parse(
        Services.prefs.getStringPref("floorp.browser.nora.csk.data", "{}")
      )
    );
  }
  startHandleShortcut(_window) {
    _window.addEventListener("keydown", (ev) => {
      if (this.disable_csk) {
        console.log("disable-csk");
        return;
      }
      if (["Control", "Alt", "Meta", "Shift"].filter((k) => ev.key.includes(k)).length === 0) {
        if (checkIsSystemShortcut(ev)) {
          console.warn(`This Event is registered in System: ${ev}`);
          return;
        }
        for (const [_key, shortcutDatum] of Object.entries(this.cskData)) {
          const key = _key;
          const { alt, ctrl, meta, shift } = shortcutDatum.modifiers;
          if (ev.altKey === alt && ev.ctrlKey === ctrl && ev.metaKey === meta && ev.shiftKey === shift && ev.key === shortcutDatum.key) {
            commands[key].command(ev);
          }
        }
      }
    });
  }
};
__publicField(_CustomShortcutKey, "instance");
__publicField(_CustomShortcutKey, "windows", []);
let CustomShortcutKey = _CustomShortcutKey;
const [showStatusbar, setShowStatusbar] = createSignal(Services.prefs.getBoolPref("browser.display.statusbar", false));
const _gFloorpStatusBar = class _gFloorpStatusBar {
  static getInstance() {
    if (!_gFloorpStatusBar.instance) {
      _gFloorpStatusBar.instance = new _gFloorpStatusBar();
    }
    return _gFloorpStatusBar.instance;
  }
  get statusbarEnabled() {
    return Services.prefs.getBoolPref("browser.display.statusbar", false);
  }
  constructor() {
    var _a;
    window.CustomizableUI.registerArea("statusBar", {
      type: window.CustomizableUI.TYPE_TOOLBAR,
      defaultPlacements: ["screenshot-button", "fullscreen-button"]
    });
    window.CustomizableUI.registerToolbarNode(document.getElementById("statusBar"));
    createEffect(() => {
      const statuspanel_label = document.getElementById("statuspanel-label");
      const statuspanel = document.getElementById("statuspanel");
      const statusText = document.getElementById("status-text");
      const observer = new MutationObserver(() => {
        if (statuspanel.getAttribute("inactive") === "true" && statusText) {
          statusText.setAttribute("hidden", "true");
        } else {
          statusText == null ? void 0 : statusText.removeAttribute("hidden");
        }
      });
      Services.prefs.setBoolPref("browser.display.statusbar", showStatusbar());
      if (showStatusbar()) {
        statusText == null ? void 0 : statusText.appendChild(statuspanel_label);
        observer.observe(statuspanel, {
          attributes: true
        });
      } else {
        statuspanel == null ? void 0 : statuspanel.appendChild(statuspanel_label);
        observer == null ? void 0 : observer.disconnect();
      }
    });
    (_a = document.body) == null ? void 0 : _a.appendChild(document.getElementById("statusBar"));
    this.observeStatusbar();
  }
  observeStatusbar() {
    Services.prefs.addObserver("browser.display.statusbar", () => setShowStatusbar(() => this.statusbarEnabled));
  }
};
__publicField(_gFloorpStatusBar, "instance");
let gFloorpStatusBar = _gFloorpStatusBar;
function ContextMenu$2() {
  return (() => {
    var _el$ = createElement("xul:menuitem");
    setProp(_el$, "data-l10n-id", "status-bar");
    setProp(_el$, "label", "Status Bar");
    setProp(_el$, "type", "checkbox");
    setProp(_el$, "id", "toggle_statusBar");
    setProp(_el$, "onCommand", () => setShowStatusbar((value) => !value));
    effect((_$p) => setProp(_el$, "checked", showStatusbar(), _$p));
    return _el$;
  })();
}
const statusbarStyle = '#statusBar {\n  border-top: 1px solid var(--chrome-content-separator-color);\n  visibility: visible !important;\n}\n\n:root[inFullscreen]:not([macOSNativeFullscreen]) #statusBar:not([fullscreentoolbar="true"]) {\n  visibility: collapse !important;\n}\n\n:root[customizing] #statusBar {\n  display: inherit !important;\n}\n\n#statusBar.collapsed {\n  display: none;\n}\n\n#statusBar #statuspanel-label {\n  box-shadow: none !important;\n  background: none !important;\n  border: none !important;\n}\n\n#statusBar #status-text {\n  overflow: hidden !important;\n}\n';
function StatusBar() {
  return [(() => {
    var _el$ = createElement("xul:toolbar"), _el$2 = createElement("xul:hbox");
    insertNode(_el$, _el$2);
    setProp(_el$, "id", "statusBar");
    setProp(_el$, "toolbarname", "Status bar");
    setProp(_el$, "customizable", "true");
    setProp(_el$, "mode", "icons");
    setProp(_el$, "context", "toolbar-context-menu");
    setProp(_el$, "accesskey", "A");
    setProp(_el$2, "id", "status-text");
    setProp(_el$2, "align", "center");
    setProp(_el$2, "flex", "1");
    setProp(_el$2, "class", "statusbar-padding");
    effect((_$p) => setProp(_el$, "class", `browser-toolbar customization-target ${showStatusbar() ? "" : "collapsed"}`, _$p));
    return _el$;
  })(), (() => {
    var _el$3 = createElement("style");
    setProp(_el$3, "jsx", true);
    insert(_el$3, statusbarStyle);
    return _el$3;
  })()];
}
function initStatusbar() {
  render(() => createComponent(StatusBar, {}), document.getElementById("navigator-toolbox"));
  insert(document.getElementById("toolbar-context-menu"), () => createComponent(ContextMenu$2, {}), document.getElementById("viewToolbarsMenuSeparator"));
  gFloorpStatusBar.getInstance();
}
function ContextMenu$1(id, l10n, runFunction) {
  return (() => {
    var _el$ = createElement("xul:menuitem");
    setProp(_el$, "data-l10n-id", l10n);
    setProp(_el$, "label", l10n);
    setProp(_el$, "id", id);
    setProp(_el$, "onCommand", runFunction);
    return _el$;
  })();
}
class gFloorpContextMenuServices {
  constructor() {
    __publicField(this, "initialized", false);
    __publicField(this, "checkItems", []);
    __publicField(this, "contextMenuObserver", new MutationObserver(() => {
      this.contextMenuObserverFunc();
    }));
  }
  get windowModalDialogElem() {
    return document.getElementById("window-modal-dialog");
  }
  get screenShotContextMenuItems() {
    return document.getElementById("context-take-screenshot");
  }
  get contentAreaContextMenu() {
    return document.getElementById("contentAreaContextMenu");
  }
  get pdfjsContextMenuSeparator() {
    return document.getElementById("context-sep-pdfjs-selectall");
  }
  get contextMenuSeparators() {
    return document.querySelectorAll("#contentAreaContextMenu > menuseparator");
  }
  init() {
    if (this.initialized) {
      return;
    }
    this.contentAreaContextMenu.addEventListener("popupshowing", () => this.onPopupShowing());
    this.initialized = true;
  }
  addContextBox(id, l10n, insertElementId, runFunction, checkID, checkedFunction) {
    const contextMenu = ContextMenu$1(id, l10n, runFunction);
    const targetNode = document.getElementById(checkID);
    const insertElement = document.getElementById(insertElementId);
    insert(this.contentAreaContextMenu, () => contextMenu, insertElement);
    this.contextMenuObserver.observe(targetNode, {
      attributes: true
    });
    this.checkItems.push(checkedFunction);
    this.contextMenuObserverFunc();
  }
  contextMenuObserverFunc() {
    for (const checkItem of this.checkItems) {
      checkItem();
    }
  }
  addToolbarContentMenuPopupSet(JSXElem) {
    insert(document.body, JSXElem, this.windowModalDialogElem);
  }
  onPopupShowing() {
    if (!this.screenShotContextMenuItems.hidden) {
      this.pdfjsContextMenuSeparator.hidden = false;
      const nextSibling = this.screenShotContextMenuItems.nextSibling;
      if (nextSibling) {
        nextSibling.hidden = false;
      }
    }
    (async () => {
      for (const contextMenuSeparator of this.contextMenuSeparators) {
        if (contextMenuSeparator.nextSibling.hidden && contextMenuSeparator.previousSibling.hidden && contextMenuSeparator.id !== "context-sep-navigation" && contextMenuSeparator.id !== "context-sep-pdfjs-selectall") {
          contextMenuSeparator.hidden = true;
        }
      }
    })();
  }
}
const gFloorpContextMenu = new gFloorpContextMenuServices();
function initBrowserContextMenu() {
  gFloorpContextMenu.init();
}
const { ContextualIdentityService } = ChromeUtils.importESModule(
  "resource://gre/modules/ContextualIdentityService.sys.mjs"
);
const PrivateContainer = {
  ENABLE_PRIVATE_CONTAINER_PREF: "floorp.privateContainer.enabled",
  PRIVATE_CONTAINER_L10N_ID: "floorp-private-container-name",
  getPrivateContainer() {
    const currentContainers = ContextualIdentityService._identities;
    return currentContainers.find(
      (container) => container.floorpPrivateContainer === true
    );
  },
  getPrivateContainerUserContextId() {
    const privateContainer = this.getPrivateContainer();
    return privateContainer ? privateContainer.userContextId : null;
  },
  removePrivateContainerData() {
    const privateContainer = this.getPrivateContainer();
    if (!privateContainer || !privateContainer.userContextId) {
      return;
    }
    Services.clearData.deleteDataFromOriginAttributesPattern({
      userContextId: privateContainer.userContextId
    });
  },
  async StartupCreatePrivateContainer() {
    const l10n = new Localization(["browser/floorp.ftl"], true);
    ContextualIdentityService.ensureDataReady();
    if (PrivateContainer.getPrivateContainer()) {
      return;
    }
    const userContextId = ++ContextualIdentityService._lastUserContextId;
    const identity = {
      userContextId,
      public: true,
      icon: "chill",
      color: "purple",
      name: await l10n.formatValue(
        PrivateContainer.PRIVATE_CONTAINER_L10N_ID
      ),
      floorpPrivateContainer: true
    };
    ContextualIdentityService._identities.push(identity);
    ContextualIdentityService.saveSoon();
    Services.obs.notifyObservers(
      ContextualIdentityService.getIdentityObserverOutput(identity),
      "contextual-identity-created"
    );
  }
};
const _gFloorpPrivateContainer = class _gFloorpPrivateContainer {
  constructor() {
    __publicField(this, "initialized", false);
    if (this.initialized) {
      return;
    }
    PrivateContainer.StartupCreatePrivateContainer();
    PrivateContainer.removePrivateContainerData();
    window.SessionStore.promiseInitialized.then(() => {
      window.gBrowser.tabContainer.addEventListener("TabClose", _gFloorpPrivateContainer.removeDataIfPrivateContainerTabNotExist);
      window.gBrowser.tabContainer.addEventListener("TabOpen", _gFloorpPrivateContainer.handleTabModifications);
      gFloorpContextMenu.addContextBox("open_in_private_container", "open-in_private-container", "context-openlink", () => _gFloorpPrivateContainer.openWithPrivateContainer(window.gContextMenu.linkURL), "context-openlink", () => {
        this.privateContainerMenuItem.hidden = this.openLinkMenuItem.hidden;
      });
    });
    this.initialized = true;
  }
  get privateContainerMenuItem() {
    return document.querySelector("#open_in_private_container");
  }
  get openLinkMenuItem() {
    return document.querySelector("#context-openlink");
  }
  static getInstance() {
    if (!_gFloorpPrivateContainer.instance) {
      _gFloorpPrivateContainer.instance = new _gFloorpPrivateContainer();
    }
    return _gFloorpPrivateContainer.instance;
  }
  static checkPrivateContainerTabExist() {
    const privateContainer = PrivateContainer.getPrivateContainer();
    if (!privateContainer || !privateContainer.userContextId) {
      return false;
    }
    return window.gBrowser.tabs.some((tab) => tab.userContextId === privateContainer.userContextId);
  }
  static removeDataIfPrivateContainerTabNotExist() {
    const privateContainerUserContextID = PrivateContainer.getPrivateContainerUserContextId();
    setTimeout(() => {
      if (!_gFloorpPrivateContainer.checkPrivateContainerTabExist()) {
        PrivateContainer.removePrivateContainerData();
      }
      return window.gBrowser.tabs.filter((tab) => tab.userContextId === privateContainerUserContextID);
    }, 400);
  }
  static tabIsSaveHistory(tab) {
    return tab.getAttribute("historydisabled") === "true";
  }
  static applyDoNotSaveHistoryToTab(tab) {
    tab.linkedBrowser.setAttribute("disablehistory", "true");
    tab.linkedBrowser.setAttribute("disableglobalhistory", "true");
    tab.setAttribute("floorp-disablehistory", "true");
  }
  static checkTabIsPrivateContainer(tab) {
    const privateContainerUserContextID = PrivateContainer.getPrivateContainerUserContextId();
    return tab.userContextId === privateContainerUserContextID;
  }
  static handleTabModifications() {
    const tabs = window.gBrowser.tabs;
    for (const tab of tabs) {
      if (_gFloorpPrivateContainer.checkTabIsPrivateContainer(tab) && !_gFloorpPrivateContainer.tabIsSaveHistory(tab)) {
        _gFloorpPrivateContainer.applyDoNotSaveHistoryToTab(tab);
      }
    }
  }
  static openWithPrivateContainer(url) {
    let relatedToCurrent = false;
    const _OPEN_NEW_TAB_POSITION_PREF = Services.prefs.getIntPref("floorp.browser.tabs.openNewTabPosition", -1);
    switch (_OPEN_NEW_TAB_POSITION_PREF) {
      case 0:
        relatedToCurrent = false;
        break;
      case 1:
        relatedToCurrent = true;
        break;
    }
    const privateContainerUserContextID = PrivateContainer.getPrivateContainerUserContextId();
    Services.obs.notifyObservers({
      wrappedJSObject: new Promise((resolve) => {
        window.openTrustedLinkIn(url, "tab", {
          relatedToCurrent,
          resolveOnNewTabCreated: resolve,
          userContextId: privateContainerUserContextID
        });
      })
    }, "browser-open-newtab-start");
  }
  static reopenInPrivateContainer() {
    let userContextId = PrivateContainer.getPrivateContainerUserContextId();
    const reopenedTabs = window.TabContextMenu.contextTab.multiselected ? window.gBrowser.selectedTabs : [window.TabContextMenu.contextTab];
    for (const tab of reopenedTabs) {
      let triggeringPrincipal;
      if (tab.linkedPanel) {
        triggeringPrincipal = tab.linkedBrowser.contentPrincipal;
      } else {
        const tabState = JSON.parse(window.SessionStore.getTabState(tab));
        try {
          triggeringPrincipal = window.E10SUtils.deserializePrincipal(tabState.triggeringPrincipal_base64);
        } catch (ex) {
          continue;
        }
      }
      if (!triggeringPrincipal || triggeringPrincipal.isNullPrincipal) {
        triggeringPrincipal = Services.scriptSecurityManager.createNullPrincipal({
          userContextId
        });
      } else if (triggeringPrincipal.isContentPrincipal) {
        triggeringPrincipal = Services.scriptSecurityManager.principalWithOA(triggeringPrincipal, {
          userContextId
        });
      }
      const currentTabUserContextId = Number.parseInt(tab.getAttribute("usercontextid"));
      if (currentTabUserContextId === userContextId) {
        userContextId = 0;
      }
      const newTab = window.gBrowser.addTab(tab.linkedBrowser.currentURI.spec, {
        userContextId,
        pinned: tab.pinned,
        index: tab._tPos + 1,
        triggeringPrincipal
      });
      if (window.gBrowser.selectedTab === tab) {
        window.gBrowser.selectedTab = newTab;
      }
      if (tab.muted && !newTab.muted) {
        newTab.toggleMuteAudio(tab.muteReason);
      }
      window.gBrowser.removeTab(tab);
    }
  }
};
__publicField(_gFloorpPrivateContainer, "instance");
let gFloorpPrivateContainer = _gFloorpPrivateContainer;
function ContextMenu() {
  return (() => {
    var _el$ = createElement("xul:menuitem");
    setProp(_el$, "id", "context_toggleToPrivateContainer");
    setProp(_el$, "data-l10n-id", "floorp-toggle-private-container");
    setProp(_el$, "label", "Toggle to Private Container");
    setProp(_el$, "onCommand", () => {
      gFloorpPrivateContainer.reopenInPrivateContainer();
    });
    return _el$;
  })();
}
function initPrivateContainer() {
  insert(document.querySelector("#tabContextMenu"), () => createComponent(ContextMenu, {}), document.querySelector("#context_selectAllTabs"));
  window.gFloorpPrivateContainer = gFloorpPrivateContainer.getInstance();
}
CustomShortcutKey.getInstance();
window.SessionStore.promiseInitialized.then(() => {
  initBrowserContextMenu();
  initPrivateContainer();
  initStatusbar();
});
//# sourceMappingURL=content.js.map
