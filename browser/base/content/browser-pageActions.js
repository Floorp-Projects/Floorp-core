/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let QRCodeGeneratePageActionButton = window.MozXULElement.parseXULToFragment(`
<hbox id="QRCodeGeneratePageAction" data-l10n-id="qrcode-generate-page-action"
  class="urlbar-page-action" tooltiptext="qrcode-generate-page-action"
  role="button" popup="qrcode-panel">
  <image id="QRCodeGeneratePageAction-image" class="urlbar-icon"/>
  <panel id="qrcode-panel" type="arrow" position="bottomright topright" onpopupshowing="generateCurrentTabQRCode()">
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
`);

function generateCurrentTabQRCode() {
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

SessionStore.promiseInitialized.then(() => {
  document.getElementById("star-button-box").before(QRCodeGeneratePageActionButton);
});
