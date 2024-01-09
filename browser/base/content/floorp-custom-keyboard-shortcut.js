/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const CustomKeyboardShortcutUtils = ChromeUtils.importESModule(
  "resource:///modules/CustomKeyboardShortcutUtils.sys.mjs"
);
const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

// const keyboradShortcutConfig = JSON.parse(
//   Services.prefs.getStringPref(
//     CustomKeyboardShortcutUtils.SHORTCUT_KEY_AND_ACTION_PREF,
//     ""
//   )
// );

const buildShortCutkeyFunctions = {
  init() {
    Services.prefs.clearUserPref(
      CustomKeyboardShortcutUtils.SHORTCUT_KEY_CHANGED_ARRAY_PREF
    );

    if (
      Services.prefs.getBoolPref(
        CustomKeyboardShortcutUtils.SHORTCUT_KEY_DISABLE_FX_DEFAULT_SCKEY_PREF,
        false
      )
    ) {
      SessionStore.promiseInitialized.then(() => {
        buildShortCutkeyFunctions.disableAllCustomKeyShortcut();
        console.info("Remove already exist shortcut keys");
      });
    }

    const keyboradShortcutConfig = JSON.parse(
      Services.prefs.getStringPref(
        CustomKeyboardShortcutUtils.SHORTCUT_KEY_AND_ACTION_PREF,
        ""
      )
    );

    if (
      keyboradShortcutConfig.length === 0 &&
      CustomKeyboardShortcutUtils.SHORTCUT_KEY_AND_ACTION_ENABLED_PREF
    ) {
      return;
    }

    for (const shortcutObj of keyboradShortcutConfig) {
      const name = shortcutObj.actionName;
      const key = shortcutObj.key;
      const keyCode = shortcutObj.keyCode;
      const modifiers = shortcutObj.modifiers;

      if ((key && name) || (keyCode && name)) {
        buildShortCutkeyFunctions.buildShortCutkeyFunction(
          name,
          key,
          keyCode,
          modifiers
        );
      } else {
        console.error("Invalid shortcut key config: " + shortcutObj);
      }
    }
  },

  buildShortCutkeyFunction(name, key, keyCode, modifiers) {
    const functionCode =
      CustomKeyboardShortcutUtils.keyboradShortcutActions[name][0];
    if (!functionCode) {
      return;
    }

    // Remove " " from modifiers.
    modifiers = modifiers.replace(/ /g, "");

    let keyElement = window.MozXULElement.parseXULToFragment(`
			<key id="${name}" class="floorpCustomShortcutKey"
				modifiers="${modifiers}"
				key="${key}"
				oncommand="${functionCode}"
			/>
		`);

    if (keyCode) {
      keyElement = window.MozXULElement.parseXULToFragment(`
				<key id="${name}" class="floorpCustomShortcutKey"
					oncommand="${functionCode}"
					keycode="${keyCode}"
				/>`);
    }

    document.getElementById("mainKeyset").appendChild(keyElement);
  },

  removeAlreadyExistShortCutkeys() {
    const mainKeyset = document.getElementById("mainKeyset");
    while (mainKeyset.firstChild) {
      mainKeyset.firstChild.remove();
    }
  },

  disableAllCustomKeyShortcut() {
    const keyElems = document.querySelector("#mainKeyset").childNodes;
    for (const keyElem of keyElems) {
      if (!keyElem.classList.contains("floorpCustomShortcutKey")) {
        keyElem.setAttribute("disabled", true);
      }
    }
  },

  disableAllCustomKeyShortcutElemets() {
    const keyElems = document.querySelectorAll(".floorpCustomShortcutKey");
    for (const keyElem of keyElems) {
      keyElem.remove();
    }
  },

  enableAllCustomKeyShortcutElemets() {
    const keyElems = document.querySelectorAll(".floorpCustomShortcutKey");
    for (const keyElem of keyElems) {
      keyElem.removeAttribute("disabled");
    }
  },

  removeCustomKeyShortcutElemets() {
    const keyElems = document.querySelectorAll(".floorpCustomShortcutKey");
    for (const keyElem of keyElems) {
      keyElem.remove();
    }
  },
};

const customActionsFunctions = {
  evalCustomeActionWithNum(num) {
    const action = Services.prefs.getStringPref(
      `floorp.custom.shortcutkeysAndActions.customAction${num}`
    );
    Function(action)();
  },
};

buildShortCutkeyFunctions.init();
