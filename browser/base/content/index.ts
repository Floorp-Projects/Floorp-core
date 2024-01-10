/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { initWorkspace } from "./floorp-workspaces.js";

initWorkspace();
console.log("Workspace Init");
//console.log(window.gWorkspaces);

(async () => {
  // await import("./floorp-workspaces.js");
  await import("./floorp-command.js");
  await import("./floorp-override.js");
  await import("./floorp-rest-mode.js");
})();

// This function is called when the floorp browser window is loaded. needs Delay.
document.addEventListener(
  "DOMContentLoaded",
  () => {
    import("./floorp-context-menu.js");

    import("./floorp-manager-sidebar.js");

    import("./floorp-preferences.js");

    import("./floorp-pageActions.js");

    import("./floorp-private-container.js");

    import("./floorp-statusbar.js");

    import("./floorp-custom-keyboard-shortcut.js");

    import("./floorp-downloadbar.js");

    import("./floorp-favicon-color.js");

    import("./floorp-UI-custom.js");

    import("./floorp-splitView.js");

    import("./floorp-browserActions.js");

    import("./floorp-pinned-tabs-title.js");

    import("./floorp-chromeCSS.js");

    // If script need more delay, use the following code.

    //Lightning Build
    //@ts-expect-error SessionStore is in firefox-code
    SessionStore.promiseInitialized.then(() => {
      import("./floorp-UI-customizing-menu.js");

      import("./floorp-tabbar.js");

      import("./floorp-design.js");

      import("./floorp-verticaltabs.js");

      import("./floorp-flex-order.js");

      import("./floorp-ssb-manager.js");
    });
  },
  { once: true }
);
