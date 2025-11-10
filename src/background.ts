import browser from './lib/browser';

browser.runtime.onMessage.addListener((request) => {
  if (request.type === 'set-fire-icon') {
    // Flip the badge to the animated icon briefly to signal success.
    void browser.action.setIcon({ path: '../../icon-fire-96x96.gif' }).then(() => {
      setTimeout(() => {
        void browser.action.setIcon({ path: '../../logo96.png' });
      }, 5000);
    });
  }

  return Promise.resolve({ status: 'OK' });
});

const syncLeetcodeSession = async () => {
  try {
    const cookie = await browser.cookies.get({
      name: 'LEETCODE_SESSION',
      url: 'https://leetcode.com/',
    });
    if (!cookie?.value) return;
    await browser.storage.sync.set({ leetcode_session: cookie.value });
    console.log('Leetcode Synced Successfully');
  } catch (error) {
    console.error('Failed to cache LeetCode session cookie', error);
  }
};

void syncLeetcodeSession();

browser.cookies.onChanged.addListener(async (info) => {
  if (info.cookie.name !== 'LEETCODE_SESSION') return;
  try {
    await browser.storage.sync.set({ leetcode_session: info.cookie?.value ?? null });
    console.log('Leetcode Re-Synced Successfully');
  } catch (error) {
    console.error('Failed to refresh cached LeetCode session cookie', error);
  }
});

browser.storage.sync.onChanged.addListener((changes) => {
  console.log('🚀 ~ file: background.ts ~ changes:', JSON.stringify(changes, null, 2));
});

export const sendMessageToContentScript = async (type: string, data: unknown) => {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length || !tabs[0].id) return;
    await browser.tabs.sendMessage(tabs[0].id, { type, data });
    console.log('✅ Acknowledged', type);
  } catch (error) {
    console.error('Failed to message content script', error);
  }
};

// Listen for submit request
browser.webRequest.onCompleted.addListener(
  (details) => {
    // Check if it's a POST request to submit the code
    if (
      details.method === 'POST' &&
      details.url.startsWith('https://leetcode.com/problems/') &&
      details.url.includes('/submit/')
    ) {
      const questionSlug = details.url.match(/\/problems\/(.*)\/submit/)?.[1] ?? null;
      if (!questionSlug) return;
      // Wait 5 secs to complete the checks
      // Send a message to the content script to get the submission
      setTimeout(() => {
        void sendMessageToContentScript('get-submission', { questionSlug });
      }, 5000);
    }
  },
  {
    urls: ['https://leetcode.com/problems/*/submit/'],
    types: ['xmlhttprequest'],
  },
);

export {};
