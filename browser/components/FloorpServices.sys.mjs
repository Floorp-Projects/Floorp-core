/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PrivateBrowsingUtils } from "resource://gre/modules/PrivateBrowsingUtils.sys.mjs";

export var EXPORTED_SYMBOLS = ["FloorpServices"];

export var FloorpServices = {
  wm: {
    getRecentWindowExcludeFloorpSpecialWindows() {
      // If there is a suggested window provided by Firefox, we'll use it.
      let suggestedWindow = Services.wm.getMostRecentWindow("navigator:browser");
      if (suggestedWindow) {
        if (
          !this.IsFloorpSpecialWindow(suggestedWindow) ||
          !PrivateBrowsingUtils.isWindowPrivate(suggestedWindow)
        ) {
          return suggestedWindow;
        }
      }

      // If the suggested window is a floorp window, or if there is no suggested window, we'll try to find another window.
      let wins = Services.wm.getEnumerator("navigator:browser");
      for (let win of wins) {
        if (
          this.IsFloorpSpecialWindow(win) ||
          PrivateBrowsingUtils.isWindowPrivate(win)
        ) {
          continue;
        }

        return win;
      }
      // If we didn't find any window, we'll return the suggested window.
      return suggestedWindow;
    },

    IsFloorpSpecialWindow(win) {
      if (
        win.floorpSsbWindow ||
        win.floorpWebPanelWindow
      ) {
        return true;
      }
      return false;
    }
  }
};
