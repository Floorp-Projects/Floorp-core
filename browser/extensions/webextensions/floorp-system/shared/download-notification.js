/*
1: ダウンロード開始だけ通知
2: ダウンロード完了だけ通知
3: ダウンロード開始と完了、両方通知
*/
const DOWNLOAD_NOTIFICATION_PREF = "floorp.download.notification";

browser.downloads.onCreated.addListener(async file => {
  let getL10nData = await browser.browserL10n.getFloorpL10nValues({
    file: ["browser/floorp.ftl"],
    text: ["floorp-started-download"],
  });
  let localizedList = [];
  for (let key in getL10nData) {
    localizedList.push(getL10nData[key]);
  }

  let pref = String(
    await browser.aboutConfigPrefs.getPref(DOWNLOAD_NOTIFICATION_PREF)
  );
  if (pref === "1" || pref === "3") {
    browser.notifications.create({
      type: "basic",
      iconUrl: "chrome://branding/content/about-logo.png",
      title: localizedList[0],
      message: file.filename,
    });
  }
});

browser.downloads.onChanged.addListener(async file => {
  let getL10nData = await browser.browserL10n.getFloorpL10nValues({
    file: ["browser/floorp.ftl"],
    text: ["floorp-finished-download"],
  });
  let localizedList = [];
  for (let key in getL10nData) {
    localizedList.push(getL10nData[key]);
  }

  let pref = String(
    await browser.aboutConfigPrefs.getPref(DOWNLOAD_NOTIFICATION_PREF)
  );
  if (file.state.current == "complete" && (pref === "2" || pref === "3")) {
    let download = await browser.downloads.search({ id: file.id });
    browser.notifications.create({
      type: "basic",
      iconUrl: "chrome://branding/content/about-logo.png",
      title: localizedList[0],
      message: download[0].filename,
    });
  }
});
