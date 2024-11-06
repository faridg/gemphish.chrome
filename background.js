chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "openSidePanel",
      title: "Open Side Panel",
      contexts: ["all"]
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openSidePanel") {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });
