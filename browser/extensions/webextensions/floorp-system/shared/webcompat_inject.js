/* eslint-disable no-undef */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

{
  const FLOORP_WEBCOMPAT_ENABLED_PREF = "floorp.webcompat.enabled";

  const WEBCOMPATS_INJECTIONS = [
    {
     /*bugs: https://github.com/Floorp-Projects/Floorp/issues/894"
      description: "Twitter (X)'s direct messages doesn't work on Firefox/Floorp if user uses Meiryo font.*/
      "matches": ["*://twitter.com/*"],
      "css": [
        { file: "webcompat/bug-894-twitter-com.css" }
      ],
      "platforms": ["win", "mac", "linux", "android"]
    },

    {
      /*bugs: https://github.com/Floorp-Projects/Floorp/issues/947
      description: "Misskey.io doesn't work with Firefox ESR 115. This is a temporary fix for cannot react to user posts."*/
      "matches": ["*://misskey.io/*"],
      "js": [
        { file: "webcompat/bug-947-misskey.io.js" }
      ],
      "platforms": ["win", "mac", "linux", "android"]
    },
  ];

  let REGISTED_CONTENT_SCRIPTS = [];

  let regist_webcompat_contentScripts = async function () {
    let platform = (await browser.runtime.getPlatformInfo()).os;
    for (let WEBCOMPAT_INJECT of WEBCOMPATS_INJECTIONS) {
      if (WEBCOMPAT_INJECT.platforms.includes(platform)) {
        let WEBCOMPAT_INJECT_cloned = Object.assign({}, WEBCOMPAT_INJECT);
        delete WEBCOMPAT_INJECT_cloned.platforms;
        let registeredContentScript = await browser.contentScripts.register(
          WEBCOMPAT_INJECT_cloned,
        );
        REGISTED_CONTENT_SCRIPTS.push(registeredContentScript);
      }
    }
  };

  let unregist_webcompat_contentScripts = async function () {
    for (let REGISTED_CONTENT_SCRIPT of REGISTED_CONTENT_SCRIPTS) {
      REGISTED_CONTENT_SCRIPT.unregister();
    }
    REGISTED_CONTENT_SCRIPTS = [];
  };

  (async () => {
    if (
      await browser.aboutConfigPrefs.getBoolPref(FLOORP_WEBCOMPAT_ENABLED_PREF)
    ) {
      await regist_webcompat_contentScripts();
    }
    browser.aboutConfigPrefs.onPrefChange.addListener(async function () {
      if (
        await browser.aboutConfigPrefs.getBoolPref(
          FLOORP_WEBCOMPAT_ENABLED_PREF,
        )
      ) {
        await unregist_webcompat_contentScripts();
        await regist_webcompat_contentScripts();
      } else {
        await unregist_webcompat_contentScripts();
      }
    }, FLOORP_WEBCOMPAT_ENABLED_PREF);
  })();
}
