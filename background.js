// enable sidepanel on extension icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// setup context menu
chrome.runtime.onInstalled.addListener((details) => {
    // create context menu
    chrome.contextMenus.create({
        id: "openSidePanel",
        title: "Analyze with Gemphisher",
        contexts: ["all"]
    });

    // open options page on install/update
    if (details.reason === 'install' || details.reason === 'update') {
        chrome.runtime.openOptionsPage();
    }
});

// handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openSidePanel") {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});
