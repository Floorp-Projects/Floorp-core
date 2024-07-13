/* global ExtensionAPI, ExtensionCommon, Services, XPCOMUtils */

const { WebRequest } = ChromeUtils.import(
	"resource://gre/modules/WebRequest.jsm",
);

this.webRequestExt = class extends ExtensionAPI {
	getAPI(context) {
		const EventManager = ExtensionCommon.EventManager;

		return {
			webRequestExt: {
				onBeforeRequest_webpanel_requestId: new EventManager({
					context,
					register: (fire) => {
						function listener(e) {
							if (
								typeof e.browserElement !== "undefined" &&
								e.browserElement.id.startsWith("webpanel")
							) {
								if (
									e.browserElement.getAttribute("changeuseragent") == "true"
								) {
									return fire.async(e.requestId);
								}
							}

							if (e.bmsUseragent === true) {
								return fire.async(e.requestId);
							}
						}
						WebRequest.onBeforeRequest.addListener(listener, null, [
							"blocking",
						]);
						return () => {
							WebRequest.onBeforeRequest.removeListener(listener, null, [
								"blocking",
							]);
						};
					},
				}).api(),
			},
		};
	}
};
