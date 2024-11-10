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

// track active tab url
let lastUrl = '';

// watch for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url !== lastUrl) {
        lastUrl = tab.url;
        // notify panel to update content
        chrome.runtime.sendMessage({ action: 'pageChanged', tabId });
    }
});
