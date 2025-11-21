# PR Helper - Task Extractor Chrome Extension

A Chrome extension that extracts unique task IDs from commit messages on GitHub Pull Request pages.

## Features

- 🔍 Automatically parses commits on GitHub PR pages
- 📋 Extracts unique task IDs from commit messages (at the start)
- 📊 Displays task count and commit count per task
- 📋 One-click copy of all task IDs
- 🎨 Clean popup UI that matches GitHub's design
- 🌙 Dark mode support
- 🔄 Refresh button to re-scan commits

## Installation

1. **Clone or download this repository**

2. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the `pr-helper` directory

3. **The extension icon will appear in your Chrome toolbar**

## Usage

1. Open any GitHub Pull Request page (e.g., `https://github.com/owner/repo/pull/123`)
2. Click the extension icon in the Chrome toolbar
3. The popup will display all unique task IDs extracted from commit messages
4. Click "📋 Copy Task IDs" to copy all task IDs to your clipboard
5. Click the refresh button (🔄) to re-scan commits if needed

## Task ID Format

By default, the extension recognizes task IDs at the start of commit messages matching the pattern:
- `TASK-123`
- `TASK123`
- `ABC-456`
- `#123`
- Any alphanumeric pattern with optional dash

### Customizing the Task ID Pattern

To customize the regex pattern for your specific task ID format, edit `content.js` and modify the `TASK_ID_PATTERN` constant:

```javascript
// Example: Match only IDs like "PROJ-123" or "PROJ-456"
const TASK_ID_PATTERN = /^(PROJ-\d+)/i;

// Example: Match IDs like "#123" or "#456"
const TASK_ID_PATTERN = /^#(\d+)/i;

// Example: Match IDs like "JIRA-123" or "TICKET-456"
const TASK_ID_PATTERN = /^([A-Z]+-\d+)/i;
```

## File Structure

```
pr-helper/
├── manifest.json      # Chrome extension manifest
├── content.js         # Content script that extracts tasks from PR page
├── popup.html         # Popup HTML structure
├── popup.js           # Popup script that displays tasks
├── popup.css          # Styling for the popup
├── styles.css         # Legacy styles (not used in popup mode)
├── README.md          # This file
└── icons8-github-*.png # Extension icons
```

## How It Works

1. The extension injects a content script on GitHub PR pages
2. When you click the extension icon, the popup requests task data from the content script
3. The content script scans the page for commit elements and commit message links
4. Extracts task IDs using regex pattern matching
5. Sends the extracted task IDs back to the popup
6. The popup displays unique task IDs in a clean, scrollable list

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Troubleshooting

**Popup shows "Not on a GitHub PR page":**
- Make sure you're on a PR page (URL contains `/pull/`)
- Refresh the page and try clicking the extension icon again

**No task IDs found:**
- Verify your commit messages start with task IDs
- Check if the task ID pattern matches your format
- Customize the `TASK_ID_PATTERN` regex in `content.js` if needed
- Click the refresh button (🔄) to re-scan commits

**Extension not loading:**
- Ensure all files are in the same directory
- Check that `manifest.json` is valid JSON
- Verify Developer mode is enabled in Chrome
- Check the browser console for errors (F12)

## License

MIT License - feel free to modify and use as needed.

