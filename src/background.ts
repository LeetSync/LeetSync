import browser from 'webextension-polyfill';

// MESSAGE LISTENER

browser.runtime.onMessage.addListener(async (request: any) => {
  if (request.type === 'set-fire-icon') {
    try {
      // Set fire icon
      await browser.action.setIcon({
        path: '../../icon-fire-96x96.gif',
      });

      // Reset icon after 5 seconds
      setTimeout(async () => {
        try {
          await browser.action.setIcon({
            path: '../../logo96.png',
          });
        } catch (err) {
          console.error('Error resetting icon:', err);
        }
      }, 5000);
    } catch (err) {
      console.error('Error setting icon:', err);
    }
  }

  return Promise.resolve({ status: 'OK' });
});

// INITIAL COOKIE SYNC

async function syncLeetCodeCookie() {
  try {
    const cookie = await browser.cookies.get({
      name: 'LEETCODE_SESSION',
      url: 'https://leetcode.com/',
    });

    if (!cookie) {
      console.log('No LEETCODE_SESSION cookie found');
      return;
    }

    await browser.storage.sync.set({
      leetcode_session: cookie.value,
    });

    console.log('Leetcode Synced Successfully');
  } catch (err) {
    console.error('Cookie sync error:', err);
  }
}

// Run initial sync
syncLeetCodeCookie();

// COOKIE CHANGE LISTENER

browser.cookies.onChanged.addListener(async (info) => {
  try {
    const { cookie } = info;

    if (cookie.name === 'LEETCODE_SESSION') {
      await browser.storage.sync.set({
        leetcode_session: cookie.value || null,
      });

      console.log('Leetcode Re-Synced Successfully');
    }
  } catch (err) {
    console.error('Cookie change error:', err);
  }
});

// STORAGE CHANGE LISTENER

browser.storage.sync.onChanged.addListener((changes) => {
  console.log(
    '🚀 Storage changes:',
    JSON.stringify(changes, null, 2),
  );
});
//send message to content script
export const sendMessageToContentScript = async (
  type: string,
  data: any,
) => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tabs.length || !tabs[0].id) {
      console.log('No active tab found');
      return;
    }

    const response = await browser.tabs.sendMessage(tabs[0].id, {
      type,
      data,
    });

    console.log('Acknowledged:', response);
  } catch (err) {
    console.error('Send message error:', err);
  }
};

// LISTEN FOR LEETCODE SUBMISSIONS

browser.webRequest.onCompleted.addListener(
  async (details) => {
    try {
      if (
        details.method === 'POST' &&
        details.url.startsWith('https://leetcode.com/problems/') &&
        details.url.includes('/submit/')
      ) {
        const questionSlug =
          details.url.match(/\/problems\/(.*)\/submit/)?.[1] ?? null;

        if (!questionSlug) {
          console.log('Question slug not found');
          return;
        }

        console.log('📌 Submission detected:', questionSlug);

        // Wait for LeetCode result processing
        setTimeout(() => {
          sendMessageToContentScript('get-submission', {
            questionSlug,
          });
        }, 5000);
      }
    } catch (err) {
      console.error('Web request listener error:', err);
    }
  },
  {
    urls: ['https://leetcode.com/problems/*/submit/'],
    types: ['xmlhttprequest'],
  },
);

// Required for TypeScript module scope
export {};