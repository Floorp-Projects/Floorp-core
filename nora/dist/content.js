var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { e as zCSKCommands, c as checkIsSystemShortcut, d as commands } from "./assets/utils.js";
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
  observe(_subj, topic, data) {
    switch (topic) {
      case "nora-csk":
        const d = zCSKCommands.safeParse(JSON.parse(data));
        if (d.success) {
          switch (d.data.type) {
            case "disable-csk": {
              this.disable_csk = d.data.data;
            }
          }
        }
        break;
    }
  }
  initCSKData() {
    this.cskData = {
      "gecko-open-new-window": {
        modifiers: {
          ctrl: true,
          shift: true,
          alt: false,
          meta: false
        },
        key: "V"
      }
    };
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
CustomShortcutKey.getInstance();
//# sourceMappingURL=content.js.map
