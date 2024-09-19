# Download the Extension from Release Section of Github
1. Navigate to Releases <br/>
    ![image](https://github.com/user-attachments/assets/f4ebf682-1897-44dc-98b2-3fe29b8ba81e)

2. Scroll down to Assets section and download the zip file
   ![image](https://github.com/user-attachments/assets/e69e73cc-e6cb-4c42-ac2b-e1cbe1187c49)

3. [Installation Guide](#installation)

# Cloned and Developing this since the original repo is Inactive
# LeetSync2 Chrome Extension

LeetSync2 is a Chrome extension that enables you to sync your LeetCode problem submissions with a selected GitHub repository. With this extension, you can easily track your coding progress and share your solutions with others on GitHub.

## Table of Contents

- [How it Works](#how-it-works)
- [Installation](#installation)
- [Maintain Streak while switching Extension](#maintain-streak-while-switching-extension)
- [Get Started](#get-started)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## How it Works

LeetSync2 utilizes the LeetCode API to fetch your submission data and the GitHub API to create a new file or update an existing one in your selected repository.

## Installation

To install LeetSync2, follow these steps:

1. Download the .zip file and extract it.
2. In your browser navigate to [chrome://Extension](chrome://extensions/).
3. Click on Load unpacked and point to the download extracted release zip.
4. Done , LeetSync2 should be visible in your browser
5. Login as Usual

# Redundant
## Maintain Streak while switching Extension

> This is technical , Hit me up if facing any issue with supporting error Screenshots

### Background

LeetSync2 uses Chrome Storage to save all sort of user data. you can access the values of this extension by

1.  Right Clicking on the LeetSync2 Extension
2.  Click on Inspect/Inspect Element/Inspect Popup
3.  This should bring up a DevTools
4.  Go to Console Tab
5.  Enter below code in console
    > await chrome.storage.sync.get(console.log())
6.  This will print all the data stored by this extension

### How to Migrate Streak while Switching Extensions

> **Don't Immediately delete the Existing/Old Extension, Delete it only after Migration is Successful**
>
> Since we can access the data saved by this app , we can also modify and play with it

1. All the Streak related data is coming from the key **_problemsSolved_** from chrome.storage
2. In you Existing/Old Extension
   2.1 Right Click on the Extension and open DevTools (Inspect)
   2.2 Navigate to Console tab and enter below code
   _await chrome.storage.sync.get("problemsSolved")_
   2.3 Right Click the printed object and click on copy object
   2.4 We got the JSON object, but we cannot directly set it in the new extension, it needs to be minified and parsed.
   2.5 Open any JSON minifying site ex: https://jsonformatter.org/
   2.6 Paste the copied JSON on left side and Click on "Validate" Json. If it is valid then click on "Minify". **Keep this Data aside , we will use it post installing Newer Extension**
3. Install this Extension(Refer **How to Install Above**) and complete the Authentication Process, after completing it should show 0 problems solved
4. Right Click the New Extension and Open DevTools
5. Go to Console
6. Copy the Minified Json from #2.6
7. Write below Code
   7.1 _newJson = 'MINIFIED_JSON'_
   _ex : newJson = '{"problemsSolved":{"container-with-most...}'_
   7.2 _newJsonParsed = JSON.parse(newJson).problemsSolved_
   7.3 _chrome.storage.sync.set({"problemsSolved" : newJsonParsed})_
8. Done, if the Extension is Open, reopen it. The Streak should be visible now

## Get Started

To configure LeetSync2, follow these steps:

1. Click on the extension icon in your Chrome toolbar.
2. In the popup window, Give Access via Github.
3. Login Via LeetCode (Optional and might be automatically skipped if already logged in)
4. Select the repository you want to sync your submissions to.
5. Start solving some problems

## Usage

To use LeetSync2, follow these steps:

1. Solve a problem on LeetCode and submit your solution.
2. LeetSync2 will create a new file or update an existing one in your selected repository automatically.
3. Go and check the submission on your github repository

## Support

If you encounter any issues or have any suggestions for improving LeetSync2, please feel free to [open an issue](https://github.com/disturbedlord/LeetSync2/issues) on the GitHub repository.

## License

LeetSync2 is licensed under the [MIT License](LICENSE).
