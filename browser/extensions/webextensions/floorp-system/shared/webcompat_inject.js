{
	const FLOORP_WEBCOMPAT_ENABLED_PREF = "floorp.webcompat.enabled";

	const WEBCOMPATS_INJECT = [
		/*
        {
            "matches": ["*://*.youtube.com/*"],
            "js": [
                { file: "webcompat/fix-youtube-comment.js" }
            ],
            "platforms": ["win"], // "mac", "win", "android", "cros", "linux", "openbsd", "fuchsia"
        }
        */
		// Test for AMO
		// {
		//     "matches": ["*://addons.mozilla.org/*/firefox/*"],
		//     "js": [
		//         { file: "webcompat/fix-addons-mozilla-org.js" }
		//     ],
		//     "css": [
		//         { file: "webcompat/fix-addons-mozilla-org.css" }
		//     ],
		//     "platforms": ["win", "mac", "linux", "android"]
		// },
	];

	let REGISTED_CONTENT_SCRIPTS = [];

	const regist_webcompat_contentScripts = async () => {
		const platform = (await browser.runtime.getPlatformInfo()).os;
		for (const WEBCOMPAT_INJECT of WEBCOMPATS_INJECT) {
			if (WEBCOMPAT_INJECT.platforms.includes(platform)) {
				const WEBCOMPAT_INJECT_cloned = Object.assign({}, WEBCOMPAT_INJECT);
				delete WEBCOMPAT_INJECT_cloned.platforms;
				const registeredContentScript = await browser.contentScripts.register(
					WEBCOMPAT_INJECT_cloned,
				);
				REGISTED_CONTENT_SCRIPTS.push(registeredContentScript);
			}
		}
	};

	const unregist_webcompat_contentScripts = async () => {
		for (const REGISTED_CONTENT_SCRIPT of REGISTED_CONTENT_SCRIPTS) {
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
		browser.aboutConfigPrefs.onPrefChange.addListener(async () => {
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
