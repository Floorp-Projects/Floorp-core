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
createEffect(() => {
  var _a, _b;
  Services.prefs.setBoolPref("browser.display.statusbar", showStatusbar());
  const statuspanel_label = document.getElementById("statuspanel-label");
  if (showStatusbar()) {
    (_a = document.getElementById("status-text")) == null ? void 0 : _a.appendChild(statuspanel_label);
  } else {
    (_b = document.getElementById("statuspanel")) == null ? void 0 : _b.appendChild(statuspanel_label);
  }
});
const _gFloorpStatusBarServices = class _gFloorpStatusBarServices {
  static getInstance() {
    if (!_gFloorpStatusBarServices.instance) {
      _gFloorpStatusBarServices.instance = new _gFloorpStatusBarServices();
    }
    return _gFloorpStatusBarServices.instance;
  }
  init() {
    var _a;
    window.CustomizableUI.registerArea("statusBar", {
      type: window.CustomizableUI.TYPE_TOOLBAR,
      defaultPlacements: ["screenshot-button", "fullscreen-button"]
    });
    window.CustomizableUI.registerToolbarNode(document.getElementById("statusBar"));
    (_a = document.body) == null ? void 0 : _a.appendChild(document.getElementById("statusBar"));
    this.observeStatusbar();
  }
  observeStatusbar() {
    Services.prefs.addObserver("browser.display.statusbar", () => setShowStatusbar(() => Services.prefs.getBoolPref("browser.display.statusbar", false)));
  }
};
__publicField(_gFloorpStatusBarServices, "instance");
let gFloorpStatusBarServices = _gFloorpStatusBarServices;
const gFloorpStatusBar = gFloorpStatusBarServices.getInstance();
function ContextMenu$1() {
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
const statusbarStyle = '#statusBar {\n  visibility: visible !important;\n}\n\n:root[inFullscreen]:not([macOSNativeFullscreen]) #statusBar:not([fullscreentoolbar="true"]) {\n  visibility: collapse !important;\n}\n\n:root[customizing] #statusBar {\n  display: inherit !important;\n}\n\n#statusBar.collapsed {\n  display: none;\n}\n\n#statusBar #statuspanel-label {\n  box-shadow: none !important;\n  background: none !important;\n  border: none !important;\n}\n\n#statusBar #status-text {\n  overflow: hidden !important;\n}\n';
function StatusBar() {
  return [(() => {
    var _el$ = createElement("xul:toolbar"), _el$2 = createElement("xul:hbox");
    insertNode(_el$, _el$2);
    setProp(_el$, "id", "statusBar");
    setProp(_el$, "toolbarname", "Status bar");
    setProp(_el$, "customizable", "true");
    setProp(_el$, "style", "border-top: 1px solid var(--chrome-content-separator-color)");
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
  insert(document.getElementById("toolbar-context-menu"), () => createComponent(ContextMenu$1, {}), document.getElementById("viewToolbarsMenuSeparator"));
  window.gFloorpStatusBar = gFloorpStatusBar;
  gFloorpStatusBar.init();
}
function ContextMenu(id, l10n, runFunction) {
  return (() => {
    var _el$ = createElement("xul:menuitem");
    setProp(_el$, "data-l10n-id", l10n);
    setProp(_el$, "label", l10n);
    setProp(_el$, "id", id);
    setProp(_el$, "onCommand", runFunction);
    return _el$;
  })();
}
const gFloorpContextMenu = {
  initialized: false,
  checkItems: [],
  contextMenuObserver: new MutationObserver(() => gFloorpContextMenu.contextMenuObserverFunc()),
  get windowModalDialogElem() {
    return document.getElementById("window-modal-dialog");
  },
  get screenShotContextMenuItems() {
    return document.getElementById("context-take-screenshot");
  },
  get contentAreaContextMenu() {
    return document.getElementById("contentAreaContextMenu");
  },
  get pdfjsContextMenuSeparator() {
    return document.getElementById("context-sep-pdfjs-selectall");
  },
  get contextMenuSeparators() {
    return document.querySelectorAll("#contentAreaContextMenu > menuseparator");
  },
  init() {
    if (this.initialized) {
      return;
    }
    gFloorpContextMenu.contentAreaContextMenu.addEventListener("popupshowing", gFloorpContextMenu.onPopupShowing);
    this.initialized = true;
  },
  addContextBox(id, l10n, insertElementId, runFunction, checkID, checkedFunction) {
    const contextMenu = ContextMenu(id, l10n, runFunction);
    const targetNode = document.getElementById(checkID);
    const insertElement = document.getElementById(insertElementId);
    insert(this.contentAreaContextMenu, () => contextMenu, insertElement);
    this.contextMenuObserver.observe(targetNode, {
      attributes: true
    });
    this.checkItems.push(checkedFunction);
    this.contextMenuObserverFunc();
  },
  contextMenuObserverFunc() {
    for (const checkItem of this.checkItems) {
      checkItem();
    }
  },
  addToolbarContentMenuPopupSet(JSXElem) {
    insert(document.body, JSXElem, this.windowModalDialogElem);
  },
  onPopupShowing() {
    if (!gFloorpContextMenu.screenShotContextMenuItems.hidden) {
      gFloorpContextMenu.pdfjsContextMenuSeparator.hidden = false;
      const nextSibling = gFloorpContextMenu.screenShotContextMenuItems.nextSibling;
      if (nextSibling) {
        nextSibling.hidden = false;
      }
    }
    (async () => {
      for (const contextMenuSeparator of gFloorpContextMenu.contextMenuSeparators) {
        if (contextMenuSeparator.nextSibling.hidden && contextMenuSeparator.previousSibling.hidden && contextMenuSeparator.id !== "context-sep-navigation" && contextMenuSeparator.id !== "context-sep-pdfjs-selectall") {
          contextMenuSeparator.hidden = true;
        }
      }
    })();
  }
};
function initBrowserContextMenu() {
  gFloorpContextMenu.init();
}
CustomShortcutKey.getInstance();
window.SessionStore.promiseInitialized.then(() => {
  initBrowserContextMenu();
  initStatusbar();
});
//# sourceMappingURL=content.js.map
