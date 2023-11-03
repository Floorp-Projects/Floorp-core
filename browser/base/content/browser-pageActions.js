/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/****************************************************** QR Code ******************************************************/

let gFloorpPageAction = {
  qrCode: {
    QRCodeGeneratePageActionButton: window.MozXULElement.parseXULToFragment(`
     <hbox id="QRCodeGeneratePageAction" data-l10n-id="qrcode-generate-page-action"
      class="urlbar-page-action" tooltiptext="qrcode-generate-page-action"
      role="button" popup="qrcode-panel">
      <image id="QRCodeGeneratePageAction-image" class="urlbar-icon"/>
      <panel id="qrcode-panel" type="arrow" position="bottomright topright" onpopupshowing="gFloorpPageAction.qrCode.onPopupShowing()">
      <vbox id="qrcode-box">
        <vbox class="panel-header">
          <html:h1>
            <html:span data-l10n-id="qrcode-generate-page-action-title"></html:span>
          </html:h1>
        </vbox>
        <toolbarseparator/>
        <vbox id="qrcode-img-vbox">
        </vbox>
       </vbox>
      </panel>
     </hbox>
    `),
    onPopupShowing() {
      Services.scriptloader.loadSubScript("chrome://browser/content/qr-code-styling/qr-code-styling.js", window);
    
      let currentTab = gBrowser.selectedTab;
      let currentTabURL = currentTab.linkedBrowser.currentURI.spec;
      
      const qrCode = new QRCodeStyling({
        width: 250,
        height: 250,
        type: "svg",
        data: currentTabURL,
        image: "chrome://branding/content/about-logo.png",
        dotsOptions: {
            color: "#4267b2",
        },
        cornersSquareOptions: {
          type: "extra-rounded",
        },
        backgroundOptions: {
            color: "#e9ebee",
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 10
        }
      });
    
      //remove old qrcode
      let QRCodeBox = document.getElementById("qrcode-img-vbox");
    
      while (QRCodeBox.firstChild) {
        QRCodeBox.firstChild.remove();
      }
    
      qrCode.append(QRCodeBox);
    }
  },

  Ssb: {
    SsbPageActionButton: window.MozXULElement.parseXULToFragment(`
    <hbox id="ssbPageAction" data-l10n-id="ssb-page-action"
     class="urlbar-page-action" tooltiptext="ssb-page-action"
     role="button" popup="ssb-panel">
     <image id="ssbPageAction-image" class="urlbar-icon"/>
     <panel id="ssb-panel" type="arrow" position="bottomright topright" onpopupshowing="gFloorpPageAction.Ssb.onPopupShowing()">
     <vbox id="ssb-box">
       <vbox class="panel-header">
         <html:h1>
           <html:span data-l10n-id="ssb-page-action-title"></html:span>
         </html:h1>
       </vbox>
       <toolbarseparator/>
       <hbox id="ssb-content-hbox">
        <vbox id="ssb-content-icon-vbox">
         <html:img id="ssb-content-icon" width="64" height="64"/>
        </vbox>
        <vbox id="ssb-content-label-vbox">
         <html:h2>
          <label id="ssb-content-label"></label>
         </html:h2>
         <description id="ssb-content-description"></description>
        </vbox>
       </hbox>
       <hbox id="ssb-button-hbox">
        <button id="ssb-button" class="panel-button ssb-app-install-button" oncommand="gFloorpPageAction.Ssb.onCommand(event, this)"/>
        <button id="ssb-button" class="panel-button ssb-app-cancel-button" data-l10n-id="ssb-app-cancel-button" oncommand="gFloorpPageAction.Ssb.closePopup()"/>
        </hbox>
      </vbox>
     </panel>
    </hbox>
   `),

   async currentTabSsb () {
    const { SiteSpecificBrowser } = ChromeUtils.import(
      "resource:///modules/SiteSpecificBrowserService.jsm"
    );

    let currentURISsbObj = await SiteSpecificBrowser.createFromBrowser(gBrowser.selectedBrowser);

    return currentURISsbObj;
   },

    async onPopupShowing() {
      let currentURISsbObj = await gFloorpPageAction.Ssb.currentTabSsb();
      let isInstalled = await gFloorpPageAction.Ssb.checkCurrentPageIsInstalled();

      let currentTabTitle = currentURISsbObj.name;
      let currentTabURL = currentURISsbObj._scope.displayHost;

      let ssbContentLabel = document.getElementById("ssb-content-label");
      let ssbContentDescription = document.getElementById("ssb-content-description");
      let ssbContentIcon = document.getElementById("ssb-content-icon");

      let installButton = document.querySelector(".ssb-app-install-button");

      if (ssbContentLabel) {
        ssbContentLabel.textContent = currentTabTitle;
      }

      if (ssbContentDescription) {
        ssbContentDescription.textContent = currentTabURL;
      }

      if (installButton) {
        if (isInstalled) {
          document.l10n.setAttributes(installButton, "ssb-app-open-button");
        } else {
          document.l10n.setAttributes(installButton, "ssb-app-install-button");
        }
      }

      if (ssbContentIcon) {
        ssbContentIcon.src = document.querySelector(".tab-icon-image[selected=true]").src;
      }
    },

    async onCommand() {
      const { SiteSpecificBrowser } = ChromeUtils.import(
        "resource:///modules/SiteSpecificBrowserService.jsm"
      );

      let isInstalled = await gFloorpPageAction.Ssb.checkCurrentPageIsInstalled();

      this.closePopup();

      if (!gBrowser.currentURI.schemeIs("https")) {
        return;
      }

      if (isInstalled) {
        const { SiteSpecificBrowserIdUtils } = ChromeUtils.import(
          "resource:///modules/SiteSpecificBrowserIdUtils.jsm"
        );

        let ssbObj = await SiteSpecificBrowserIdUtils.getIdByUrl(
          gBrowser.selectedBrowser.currentURI
        );

        if (ssbObj) {
          let id = ssbObj.id;
          SiteSpecificBrowserIdUtils.runSSBWithId(id);
          console.log("Open SSB with id: " + id);

          return;
        }
      }

      let ssb = await SiteSpecificBrowser.createFromBrowser(gBrowser.selectedBrowser)
      
      await ssb.install();

      await SiteSpecificBrowserIdUtils.runSSBWithId(ssb.id);

      // The site's manifest may point to a different start page so explicitly
      // open the SSB to the current page.
      gBrowser.removeTab(gBrowser.selectedTab, { closeWindowWithLastTab: false });
    },

    closePopup() {
      document.getElementById("ssb-panel").hidePopup();
    },

    async checkCurrentPageIsInstalled() {
      const { SiteSpecificBrowserExternalFileService } = ChromeUtils.import(
        "resource:///modules/SiteSpecificBrowserExternalFileService.jsm"
      );

      let currentTabSsb = await gFloorpPageAction.Ssb.currentTabSsb();

      let ssbData = await SiteSpecificBrowserExternalFileService.getCurrentSsbData();

      
      for (let key in ssbData) {
        if (key === currentTabSsb._manifest.start_url) {
          return true;
        }
      }
      return false;
    },
  }
}

SessionStore.promiseInitialized.then(() => {
  document.getElementById("star-button-box").before(gFloorpPageAction.qrCode.QRCodeGeneratePageActionButton);

  if (Services.prefs.getBoolPref("browser.ssb.enabled")) {
    document.getElementById("star-button-box").before(gFloorpPageAction.Ssb.SsbPageActionButton);
  }
});
