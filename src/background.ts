chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'set-fire-icon') {
    //set icon to fire then back to normal after 2 second

    chrome.action.setIcon(
      {
        path: '../../icon-fire-96x96.gif',
      },
      () => {
        setTimeout(() => {
          chrome.action.setIcon({
            path: '../../logo96.png',
          });
        }, 5000);
      }
    );
  }
  /* Will be used if we want to get messages from content scripts to background script */
  sendResponse({ status: 'OK' });
});
chrome.cookies.get(
  { name: 'LEETCODE_SESSION', url: 'https://leetcode.com/' },
  function (cookie) {
    if (!cookie) return;
    chrome.storage.sync.set({ leetcode_session: cookie.value }, () => {
      console.log(`Leetcode Synced Successfully`);
    });
  }
);

chrome.cookies.onChanged.addListener(function (info) {
  const { cookie } = info;
  //get LEETCODE_SESSION cookie
  if (cookie.name === 'LEETCODE_SESSION') {
    //save cookie value to local storage
    chrome.storage.sync.set({ leetcode_session: cookie?.value || null }, () => {
      console.log(`Leetcode Re-Synced Successfully`);
    });
  }
});
chrome.storage.sync.onChanged.addListener((changes) => {
  console.log(
    `🚀 ~ file: background.ts:68 ~ changes:`,
    JSON.stringify(changes, null, 2)
  );
});
//@ts-ignore
let previousURL: string = '';
//@ts-ignore
let tabId: number;

chrome.webNavigation.onHistoryStateUpdated.addListener(
  ({ url }) => {
    //check if redirected from leetcode.com/problems/* to leetcode.com/problems/*/submissions/*
    //if yes, then call getSubmission
    const submissionNumber = url.split('/')?.[6] || null;

    if (!submissionNumber) return;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs.length || !tabs[0].id) return;
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: 'get-submission', data: { submissionId: submissionNumber } },
        function (response) {
          if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            // Handle the error here
            return;
          }
          console.log(`✅ Acknowledged`, response);
        }
      );
    });
  },
  {
    url: [
      {
        urlMatches: 'https://leetcode.com/problems/*',
        pathContains: 'submissions',
      },
    ],
  }
);
//this is responsible for updating the previousURL variable
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    tabId = details.tabId;
    previousURL = details.url;
  },
  {
    url: [
      {
        hostSuffix: 'leetcode.com',
      },
    ],
  }
);

export {};
