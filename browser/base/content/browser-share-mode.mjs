/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const gFloorpShareMode = {
    initialized: false,

    init() {
        if (this.initialized) {
            return;
        }

        let beforeElem = document.getElementById("menu_openFirefoxView");
        let addElem = window.MozXULElement.parseXULToFragment(`
            <menuitem data-l10n-id="sharemode-menuitem" type="checkbox" id="toggle_sharemode" checked="false"
                  oncommand="gFloorpShareMode.addOrRemoveShareModeCSS();" accesskey="S">
            </menuitem>
        `);
        beforeElem.after(addElem);

        this.initialized = true;
    },


    addOrRemoveShareModeCSS() {
        const cssExist = document.getElementById("sharemode");

        if (!cssExist) {
            const css = document.createElement("style");
            css.id = "sharemode";
            css.textContent =
                "@import url(chrome://browser/skin/designs/options/sharemode.css);";
            document.head.appendChild(css);
        } else {
            cssExist.remove();
        }
    }

};

gFloorpShareMode.init();
