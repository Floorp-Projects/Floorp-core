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
     <panel id="ssb-panel" type="arrow" position="bottomright topright" onpopupshowing="gFloorpPageAction.qrCode.generateCurrentTabQRCode()">
     <vbox id="ssb-box">
       <vbox class="panel-header">
         <html:h1>
           <html:span data-l10n-id="ssb-page-action-title"></html:span>
         </html:h1>
       </vbox>
       <toolbarseparator/>
       <vbox id="qrcode-img-vbox">
       </vbox>
      </vbox>
     </panel>
    </hbox>
   `),

    async onPopupShowing() {
      let currentPageUrl = gBrowser.selectedBrowser.currentURI.spec;

      let ssb = await SiteSpecificBrowser.createFromBrowser(
        gBrowser.selectedBrowser
      );
    },

    async onCommand(event, buttonNode) {
      if (!gBrowser.currentURI.schemeIs("https")) {
        return;
      }
  
      let ssb = await SiteSpecificBrowser.createFromBrowser(
        gBrowser.selectedBrowser
      );
  
      // Launching through the UI implies installing.
      await ssb.install();
  
      // The site's manifest may point to a different start page so explicitly
      // open the SSB to the current page.
      ssb.launch(gBrowser.selectedBrowser.currentURI);
      gBrowser.removeTab(gBrowser.selectedTab, { closeWindowWithLastTab: false });
    }
  }
}

SessionStore.promiseInitialized.then(() => {
  document.getElementById("star-button-box").before(gFloorpPageAction.qrCode.QRCodeGeneratePageActionButton);
  document.getElementById("star-button-box").before(gFloorpPageAction.Ssb.SsbPageActionButton);
});
