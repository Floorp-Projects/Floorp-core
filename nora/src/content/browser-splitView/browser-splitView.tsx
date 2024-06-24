import { insert } from "@solid-xul/solid-xul";
import splitViewStyle from "./browser-splitView.pcss?inline";
import { HideSplitViewSplitter, SplitViewSplitter } from "./split-view-splitter";

export class gSplitView {
  private static instance: gSplitView;

  public static getInstance() {
    if (!gSplitView.instance) {
      gSplitView.instance = new gSplitView();
    }
    return gSplitView.instance;
  }

  private static StyleElement = () => {
    return <style id="splitViewCSS">{ splitViewStyle }</style>
  }

  public static setSplitView(tab: {
    linkedBrowser: { docShellIsActive: boolean };
    linkedPanel: string;
    hasAttribute: (arg0: string) => boolean;
    setAttribute: (arg0: string, arg1: string) => void;
  }, side: string) {
    try {
      this.removeSplitView();
    } catch (e) {}
    Services.prefs.setBoolPref("floorp.browser.splitView.working", true);

    let panel = this.getLinkedPanel(tab.linkedPanel);
    let browser = tab.linkedBrowser;
    let browserDocShellIsActiveState = browser.docShellIsActive;

    // Check if the a tab is already in split view
    let tabs = window.gBrowser.tabs;
    for (const tab of tabs) {
      if (tab.hasAttribute("splitView")) {
        this.removeSplitView();
        break;
      }
    }

    insert(document.head, () => this.StyleElement, document.head?.lastChild);

    tab.setAttribute("splitView", "true");
    panel.setAttribute("splitview", side);
    panel.setAttribute("splitviewtab", "true");
    panel.classList.add("deck-selected");

    this.splitterHide();

    insert(
      document.getElementById("tabbrowser-tabpanels"),
      () => <SplitViewSplitter />,
      document.getElementById("tabbrowser-tabpanels")?.lastChild
    )

    if (side === "left") {
      document.getElementById("splitview-splitter")?.setAttribute("style", "order: 1");
    } else {
      document.getElementById("splitview-splitter")?.setAttribute("style", "order: 3");
    }

    if (!browserDocShellIsActiveState) {
      browser.docShellIsActive = true;
    }

    this.setLocationChangeEvent();

    //Save splitView resized size to pref
    let currentSplitViewTab: any = document.querySelector(`.tabbrowser-tab[splitView="true"]`);
    let currentSplitViewPanel = this.getLinkedPanel(currentSplitViewTab?.linkedPanel);
    const appcontent = document.getElementById("appcontent") as XULElement
    const panelWidth: number = appcontent?.clientWidth / 2 - 3;

    currentSplitViewPanel.setAttribute("style", `width: ${panelWidth}px`);
    if (currentSplitViewTab !== window.gBrowser.selectedTab) {
      window.gBrowser.getPanel().style.width = panelWidth + "px";
    }
    Services.prefs.setIntPref("floorp.browser.splitView.width", panelWidth);

    window.splitViewResizeObserver = new ResizeObserver(() => {
      let currentTab = window.gBrowser.selectedTab;
      if (
        Services.prefs.getBoolPref("floorp.browser.splitView.working") === true
        && currentSplitViewTab !== currentTab
      ) {
        let width = window.gBrowser.getPanel().clientWidth;
        Services.prefs.setIntPref("floorp.browser.splitView.width", width);
      }
    });
    window.splitViewResizeObserver.observe(
      document.querySelector("#tabbrowser-tabpanels [splitviewtab = true]")
    )
  }

  public static removeSplitView() {
    Services.prefs.setBoolPref("floorp.browser.splitView.working", false);

    let tab: any = document.querySelector(`.tabbrowser-tab[splitView="true"]`);
    if (!tab) {
      return;
    }
    let panel = this.getLinkedPanel(tab.linkedPanel);

    //remove style
    let CSSElem = document.getElementById("splitViewCSS");
    CSSElem?.remove();

    document.getElementById("splitview-splitter")?.remove();
    tab.removeAttribute("splitView");
    panel.removeAttribute("splitview");
    panel.removeAttribute("splitviewtab");
    if (tab !== window.gBrowser.selectedTab) {
      panel.classList.remove("deck-selected");
    }

    if (window.browser.docShellIsActive) {
      window.browser.docShellIsActive = false;
    }

    let tabPanels = document.querySelectorAll("#tabbrowser-tabpanels > *");
    for (const tabPanel of tabPanels) {
      tabPanel.removeAttribute("width");
      tabPanel.removeAttribute("style");
    }

    this.removeLocationChangeEvent();
    window.splitViewResizeObserver.disconnect();
  }

  private static getLinkedPanel(id: string) {
    return document.getElementById(id) as XULElement;
  }

  private static splitterHide() {
    if (
      window.gBrowser.selectedTab ===
      document.querySelector(".tabbrowser-tab[splitView='true']")) {
        insert(
          document.head,
          () => <HideSplitViewSplitter />,
          document.head?.lastChild
        )
    } else {
      let splitterHideCSS = document.getElementById("splitterHideCSS");
      if (splitterHideCSS) {
        splitterHideCSS.remove();
      }
    }
  }

  private static setLocationChangeEvent() {
    document.addEventListener(
      "floorpOnLocationChangeEvent",
      this.locationChange
    )
  }

  private static removeLocationChangeEvent() {
    document.removeEventListener(
      "floorpOnLocationChangeEvent",
      this.locationChange
    )
  }

  private static locationChange() {
    gSplitView.splitterHide();
    let currentSplitViewTab: any = document.querySelector(`.tabbrowser-tab[splitView="true"]`);
    let currentSplitViewPanel = gSplitView.getLinkedPanel(currentSplitViewTab?.linkedPanel);
    if (currentSplitViewPanel !== window.gBrowser.getPanel()) {
      window.gBrowser.getPanel().style.width = Services.prefs.getIntPref("floorp.browser.splitView.width") + "px";
    }

    gSplitView.handleTabEvent();
  }

  private static handleTabEvent() {
    if (!Services.prefs.getBoolPref("floorp.browser.splitView.working")) {
      return;
    }

    let currentSplitViewTab: any = document.querySelector(`.tabbrowser-tab[splitView="true"]`);
    let currentSplitViewPanel = this.getLinkedPanel(currentSplitViewTab?.linkedPanel);
    let currentSplitViewBrowser = currentSplitViewTab?.linkedBrowser;

    if (!currentSplitViewBrowser) {
      return;
    }

    // set renderLayers to true & Set class to deck-selected
    currentSplitViewBrowser.renderLayer = true;
    currentSplitViewPanel?.classList.add("deck-selected");

    if (!currentSplitViewBrowser.docShellIsActive) {
      currentSplitViewBrowser.docShellIsActive = true;
    }

    function applySplitView() {
      currentSplitViewBrowser.renderLayers = true;
      currentSplitViewPanel?.classList.add("deck-selected");

      if (!window.browser.docShellIsActive) {
        window.browser.docShellIsActive = true;
      }
    }

    (function modifyDeckSelectedClass() {
      let tabs = window.gBrowser.tabs;
      for (const tab of tabs) {
        let panel = gSplitView.getLinkedPanel(tab.linkedPanel);
        if (tab.hasAttribute("splitView") || tab == window.gBrowser.selectedTab) {
          panel?.classList.add("deck-selected");
        } else {
          panel?.classList.remove("deck-selected");
        }
      }
    })();

    window.setTimeout(applySplitView, 1000);
  }
}