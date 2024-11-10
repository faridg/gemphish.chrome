// enable sidepanel on extension icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// setup context menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "openSidePanel",
        title: "Open Side Panel",
        contexts: ["all"]
    });
});

// handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openSidePanel") {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});
