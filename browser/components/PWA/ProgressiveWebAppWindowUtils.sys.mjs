/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";

var { XPCOMUtils } = ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm');

const lazy = {};

XPCOMUtils.defineLazyModuleGetters(lazy, {
  NetUtil: 'resource://gre/modules/NetUtil.jsm',
  setTimeout: 'resource://gre/modules/Timer.jsm',
});

XPCOMUtils.defineLazyServiceGetter(lazy, 'ImgTools', '@mozilla.org/image/tools;1', Ci.imgITools);
XPCOMUtils.defineLazyServiceGetter(lazy, 'WinUIUtils', '@mozilla.org/windows-ui-utils;1', Ci.nsIWindowsUIUtils);
XPCOMUtils.defineLazyServiceGetter(lazy, 'WinTaskbar', '@mozilla.org/windows-taskbar;1', Ci.nsIWinTaskbar);


export const EXPORTED_SYMBOLS = ["ProgressiveWebAppWindowUtils"];

export let ProgressiveWebAppWindowUtils = {
    buildIconList (icons, purpose = 'any') {
        let iconList = [];
      
        for (let icon of icons) {
          if (!icon.purpose.split().includes(purpose)) { continue; }
          iconList.push(...this.buildIconSizeList(icon));
        }
      
        iconList.sort((a, b) => (a.size > b.size) ? 1 : -1);
        return iconList;
    },
      
    buildIconSizeList(icon) {
        let sizeList = [];
      
        for (let sizeSpec of icon.sizes.split()) {
          const size = sizeSpec === 'any' ? Number.MAX_SAFE_INTEGER : parseInt(sizeSpec);
          sizeList.push({ icon, size });
        }
      
        return sizeList;
    },
      
    loadImage (uri) {
        return new Promise((resolve, reject) => {
          let channel = this.createChannel(uri);
      
          lazy.ImgTools.decodeImageFromChannelAsync(
            uri,
            channel,
            (container, status) => {
              if (Components.isSuccessCode(status)) {
                resolve({
                  type: channel.contentType,
                  container,
                });
              } else {
                reject(Components.Exception('Failed to load image', status));
              }
            },
            null
          );
        });
    },
      
    createChannel(uri) {
        return lazy.NetUtil.newChannel({
          uri,
          loadUsingSystemPrincipal: true,
       });
    },
      
    async getIcon (icons, size) {
        if (icons.length === 0) {return null;}
      
        let icon = this.findIconBySize(icons, size);
        
        try {
          let image = await this.loadImage(Services.io.newURI(icon.icon.src));
          return image.container;
        } catch (error) {
          console.warn(error + "Use the default icon instead.");
          return null;
        }
    },
      
    findIconBySize(icons, size) {
        let icon = icons.find(icon => icon.size >= size);
        
        if (!icon) {icon = icons[icons.length - 1];}
        
        return icon;
    },
      
    async setWindowIcons (window, iconSrc) {

        console.log('setWindowIcons', iconSrc);

        let iconList = this.buildIconList([{
          purpose: 'any',
          sizes: 'any',
          src: iconSrc, // example: document.querySelector('.tab-icon-image[selected="true"]').src
        }]);
      
        let windowIcons = await Promise.all([
            this.getIcon(iconList, lazy.WinUIUtils.systemSmallIconSize),
          this.getIcon(iconList, lazy.WinUIUtils.systemLargeIconSize),
        ]);
      
        if (windowIcons[0] && windowIcons[1]) {
            this.setWindowIconWithDelay(window, windowIcons[0], windowIcons[1]);
        }
    },
      
    setWindowIconWithDelay(window, smallIcon, largeIcon) {
        // There is a small delay here because otherwise `setWindowIcon` may fail
        // It shouldn't visually matter because the icon will be set by a shortcut anyway
        lazy.setTimeout(() => {
            lazy.WinUIUtils.setWindowIcon(window, smallIcon, largeIcon);
        }, 100);
    },

    setWindowAttributes(window, id) {
        window.document.documentElement.setAttribute('icon', `Floorp-${id}`);
        window.document.documentElement.setAttribute('windowclass', `Floorp-${id}`);
        window.document.documentElement.setAttribute('windowname', `Floorp-${id}`);
    },
    

    applySystemIntegration (window, id, icon) {
        this.setWindowAttributes(window, id);
        
        if (AppConstants.platform === 'win') {
          lazy.WinTaskbar.setGroupIdForWindow(window, `mozilla.Floorp-${id}`);
          this.setWindowIcons(window, icon);
        }
    }
}
