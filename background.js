function groupTabs(scope) {
  const queryOptions = scope === 'currentWindow' ? {currentWindow: true} : {};
  
  chrome.tabs.query(queryOptions, (tabs) => {
    const domains = {};
    tabs.forEach((tab) => {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!domains[domain]) {
        domains[domain] = [];
      }
      domains[domain].push(tab.id);
    });

    Object.entries(domains).forEach(([domain, tabIds]) => {
      if (tabIds.length > 1) {
        chrome.tabGroups.query({title: domain}, (groups) => {
          if (groups.length > 0) {
            chrome.tabs.group({groupId: groups[0].id, tabIds});
          } else {
            chrome.tabs.group({tabIds}, (groupId) => {
              chrome.tabGroups.update(groupId, {title: domain});
            });
          }
        });
      }
    });
  });
}

function saveGroups() {
  chrome.tabGroups.query({}, (groups) => {
    const groupData = groups.map(group => ({
      title: group.title,
      color: group.color
    }));
    chrome.storage.local.set({savedGroups: groupData}, () => {
      console.log('Groups saved');
    });
  });
}

function loadGroups() {
  chrome.storage.local.get(['savedGroups'], (result) => {
    if (result.savedGroups) {
      result.savedGroups.forEach(groupData => {
        chrome.tabs.group({}, (groupId) => {
          chrome.tabGroups.update(groupId, {
            title: groupData.title,
            color: groupData.color
          });
        });
      });
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'groupTabs') {
    groupTabs(request.scope);
  } else if (request.action === 'saveGroups') {
    saveGroups();
  } else if (request.action === 'loadGroups') {
    loadGroups();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    groupTabs('currentWindow');
  }
});

chrome.tabs.onMoved.addListener(() => {
  groupTabs('currentWindow');
});

chrome.tabs.onAttached.addListener(() => {
  groupTabs('currentWindow');
});