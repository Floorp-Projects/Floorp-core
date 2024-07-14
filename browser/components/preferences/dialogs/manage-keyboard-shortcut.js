/* eslint-disable no-undef */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* import-globals-from /toolkit/content/preferencesBindings.js */

const CustomKeyboardShortcutUtils = ChromeUtils.importESModule(
	"chrome://floorp/content/modules/csk/CustomKeyboardShortcutUtils.mjs",
);

ChromeUtils.defineLazyGetter(this, "L10n", () => {
	return new Localization(["branding/brand.ftl", "browser/floorp"]);
});

const keyboradShortcutConfig = JSON.parse(
	Services.prefs.getStringPref(
		CustomKeyboardShortcutUtils.SHORTCUT_KEY_AND_ACTION_PREF,
		"",
	),
);

const allActions =
	CustomKeyboardShortcutUtils.keyboradShortcutFunctions.getInfoFunctions.getkeyboradShortcutActions();
const pressedKeys = [];
let isTracking = false;

function setTitle() {
	const winElem = document.documentElement;
	document.l10n.setAttributes(winElem, "shortcutkey-customize");
}
setTitle();

function onLoad() {
	const actionsPopup = document.getElementById("actionsPopup");
	const shortcutKeyName = document.getElementById("selectedActionName");
	for (let i = 0; i < allActions.length; i++) {
		const action = allActions[i];
		const element = window.MozXULElement.parseXULToFragment(`
        <menuitem data-l10n-id="${CustomKeyboardShortcutUtils.keyboradShortcutFunctions.getInfoFunctions.getFluentLocalization(
					action,
				)}" value="${action}"></menuitem>
      `);
		actionsPopup.appendChild(element);
	}
	if (window.arguments[0] != undefined) {
		shortcutKeyName.value = window.arguments[0].actionName;
	} else {
		shortcutKeyName.value = allActions[0];
	}

	// Get input keys
	const keyListInput = document.getElementById("keyList");
	const l10n = new Localization(["browser/floorp.ftl"], true);
	keyListInput.placeholder = l10n.formatValueSync(
		"shortcutkey-customize-key-list-placeholder",
	);

	document.getElementById("startButton").addEventListener("click", () => {
		if (!isTracking) {
			const shortcutKeyName = document.getElementById("selectedActionName");
			shortcutKeyName.disabled = true;
			document.getElementById("keyList").value = "";
			isTracking = true;
			pressedKeys.length = 0;
			document.addEventListener("keydown", handleKeyDown);
		}
	});

	document.getElementById("endButton").addEventListener("click", () => {
		if (isTracking) {
			const shortcutKeyName = document.getElementById("selectedActionName");
			shortcutKeyName.disabled = false;
			isTracking = false;
			document.removeEventListener("keydown", handleKeyDown);
		}
	});

	document.addEventListener("dialogaccept", setPref);
}

function handleKeyDown(event) {
	if (
		isTracking &&
		!pressedKeys.includes(event.key) &&
		checkInputKeyCanUse(event.key)
	) {
		pressedKeys.push(event.key);
		displayPressedKeys();
	}
}

function displayPressedKeys() {
	const keyListInput = document.getElementById("keyList");
	keyListInput.value = pressedKeys.join(", ");
}

function checkInputKeyCanUse(key) {
	// separate key and modifiers
	const modifiersList =
		CustomKeyboardShortcutUtils.keyboradShortcutFunctions.modifiersListFunctions.getModifiersList();
	const keyCodeList =
		CustomKeyboardShortcutUtils.keyboradShortcutFunctions.keyCodesListFunctions.getKeyCodesList();
	const cannotUseModifiers = CustomKeyboardShortcutUtils.cannotUseModifiers;
	const keyListInput = document.getElementById("keyList").value.split(", ");

	const regex = /^[0-9a-zA-Z]*$/;

	if (modifiersList.includes(key) && !keyCodeIsInputed()) {
		return true;
	} else if (
		keyCodeList.includes(key) &&
		!keyIsInputed() &&
		!keyCodeIsInputed() &&
		!modifierIsInputed()
	) {
		return true;
	} else if (
		regex.test(key) &&
		!cannotUseModifiers.includes(key) &&
		key.length == 1 &&
		!keyListInput.includes(key) &&
		!keyIsInputed() &&
		!keyCodeIsInputed()
	) {
		return true;
	}
	return false;
}

function keyIsInputed() {
	const keyListInput = document.getElementById("keyList").value.split(", ");
	for (inputedKey of keyListInput) {
		if (inputedKey.length === 1) {
			console.warn("key is already used. Modifier key is allowed only.");
			return true;
		}
	}
	return false;
}

function modifierIsInputed() {
	const keyListInput = document.getElementById("keyList").value.split(", ");
	const modifiersList =
		CustomKeyboardShortcutUtils.keyboradShortcutFunctions.modifiersListFunctions.getModifiersList();
	for (inputedKey of keyListInput) {
		if (modifiersList.includes(inputedKey)) {
			console.warn("modifier is already used. Modifier is allowed only.");
			return true;
		}
	}
	return false;
}

function keyCodeIsInputed() {
	const keyListInput = document.getElementById("keyList").value.split(", ");
	const keyCodeList =
		CustomKeyboardShortcutUtils.keyboradShortcutFunctions.keyCodesListFunctions.getKeyCodesList();

	for (inputedKey of keyListInput) {
		if (keyCodeList.includes(inputedKey)) {
			console.warn("keyCode is already used. Cannot add key anymore.");
			return true;
		}
	}
	return false;
}

function separateKeyAndModifiers(keyList) {
	let KeyResult = "";
	let keyCodeResult = "";
	const modifiers = [];
	const keyCodeList =
		CustomKeyboardShortcutUtils.keyboradShortcutFunctions.keyCodesListFunctions.getKeyCodesList();
	const modifiersList =
		CustomKeyboardShortcutUtils.keyboradShortcutFunctions.modifiersListFunctions.getModifiersList();
	const regex = /^[0-9a-zA-Z]*$/;

	for (let i = 0; i < keyList.length; i++) {
		const key = keyList[i];
		if (modifiersList.includes(key)) {
			modifiers.push(key);
		} else if (keyCodeList.includes(key)) {
			keyCodeResult = key;
		} else if (regex.test(key)) {
			KeyResult = key;
		} else {
			console.info("Invalid key");
		}
	}
	return [KeyResult, keyCodeResult, modifiers];
}

function setPref() {
	const shortcutKeyName = document.getElementById("selectedActionName").value;
	const keyListInput = separateKeyAndModifiers(
		document.getElementById("keyList").value.split(", "),
	);

	const keyCodeResult =
		CustomKeyboardShortcutUtils.keyboradShortcutFunctions.keyCodesListFunctions.conversionToXULKeyCode(
			keyListInput[1],
		)
			? CustomKeyboardShortcutUtils.keyboradShortcutFunctions.keyCodesListFunctions.conversionToXULKeyCode(
					keyListInput[1],
				)
			: "";
	let modifiersResult = "";
	// keyListInput[2] have to be String
	for (let i = 0; i < keyListInput[2].length; i++) {
		if (i === 0) {
			modifiersResult = keyListInput[2][i].toLowerCase();
		} else {
			modifiersResult += ", " + keyListInput[2][i].toLowerCase();
		}
	}

	if (!keyListInput[0].length && !keyListInput[1].length) {
		return;
	}

	let changedActions = Services.prefs.getStringPref(
		CustomKeyboardShortcutUtils.SHORTCUT_KEY_CHANGED_ARRAY_PREF,
		"",
	);

	if (changedActions.length) {
		changedActions = changedActions.split(",");
	} else {
		changedActions = [];
	}

	if (!changedActions.includes(shortcutKeyName)) {
		changedActions.push(shortcutKeyName);

		Services.prefs.setStringPref(
			CustomKeyboardShortcutUtils.SHORTCUT_KEY_CHANGED_ARRAY_PREF,
			changedActions.join(","),
		);
	}

	CustomKeyboardShortcutUtils.keyboradShortcutFunctions.preferencesFunctions.addKeyForShortcutAction(
		shortcutKeyName,
		keyListInput[0].toLowerCase(),
		keyCodeResult,
		modifiersResult,
	);
}
