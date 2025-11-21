// PR Helper - Task Extractor Content Script

(function() {
  'use strict';

  // Configuration: Regex pattern to match task IDs at the start of commit messages
  // Default pattern matches formats like: TASK-123, TASK123, #123, ABC-123, etc.
  // You can customize this regex to match your specific task ID format
  const TASK_ID_PATTERN = /^([A-Z]+-?\d+|\d+)/i;

  // Extract task IDs from commit messages
  function extractTaskIds() {
    const taskIds = new Set();
    const taskDetails = new Map(); // Store task ID -> commit info mapping
    const processedMessages = new Set(); // Avoid duplicates

    // Strategy 1: Find all commit message links (most reliable)
    const commitLinks = document.querySelectorAll('a[href*="/commit/"]');
    commitLinks.forEach(link => {
      // Get the commit message text
      // The link might contain the message directly, or it might be in a parent/sibling element
      let commitMessage = '';
      
      // Try to get text from the link itself
      commitMessage = link.textContent.trim();
      
      // If link text is just a hash, look for message in nearby elements
      if (commitMessage.length < 10 || commitMessage.match(/^[a-f0-9]{7,40}$/i)) {
        // Look in parent container for commit message
        const parent = link.closest('div[data-testid="commit-row"]') ||
                      link.closest('li') ||
                      link.closest('div.Box-row') ||
                      link.closest('div.commit') ||
                      link.parentElement;
        
        if (parent) {
          // Try to find message in various possible locations
          const messageElement = parent.querySelector('a[href*="/commit/"] + span') ||
                                parent.querySelector('.commit-message') ||
                                parent.querySelector('p[class*="commit"]') ||
                                parent.querySelector('span[class*="commit"]') ||
                                parent.querySelector('div[class*="message"]');
          
          if (messageElement) {
            commitMessage = messageElement.textContent.trim();
          } else {
            // Get all text from parent, but exclude the hash link
            const clone = parent.cloneNode(true);
            const linkClone = clone.querySelector('a[href*="/commit/"]');
            if (linkClone) linkClone.remove();
            commitMessage = clone.textContent.trim();
          }
        }
      }
      
      // Clean up the message (remove extra whitespace, newlines)
      commitMessage = commitMessage.replace(/\s+/g, ' ').trim();
      
      // Skip if we've already processed this message
      if (!commitMessage || processedMessages.has(commitMessage)) {
        return;
      }
      
      processedMessages.add(commitMessage);
      
      // Extract task ID from the beginning of the commit message
      const match = commitMessage.match(TASK_ID_PATTERN);
      if (match) {
        const taskId = match[1].toUpperCase();
        taskIds.add(taskId);
        
        if (!taskDetails.has(taskId)) {
          taskDetails.set(taskId, {
            id: taskId,
            commits: []
          });
        }
        
        taskDetails.get(taskId).commits.push({
          message: commitMessage,
          url: link.href
        });
      }
    });

    // Strategy 2: Look for commit rows/elements if we didn't find enough commits
    if (taskIds.size === 0 || commitLinks.length === 0) {
      const commitSelectors = [
        'div[data-testid="commit-row"]',
        'div[data-testid="commit-row-item"]',
        'li[data-testid="commit-row-item"]',
        'div.commit-group li',
        'li.commit',
        'div.js-navigation-item[data-testid="commit-row-item"]',
        'div.Box-row--focus-gray',
        'div[class*="commit-row"]',
        'div[class*="CommitRow"]'
      ];

      for (const selector of commitSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(element => {
            // Try multiple ways to extract the commit message
            let commitMessage = '';
            
            // Method 1: Look for commit message link
            const msgLink = element.querySelector('a[href*="/commit/"]');
            if (msgLink) {
              // Get text after the link or from sibling elements
              const nextSibling = msgLink.nextElementSibling;
              if (nextSibling) {
                commitMessage = nextSibling.textContent.trim();
              } else {
                // Get all text from element, excluding the hash
                const clone = element.cloneNode(true);
                const links = clone.querySelectorAll('a[href*="/commit/"]');
                links.forEach(l => {
                  if (l.textContent.match(/^[a-f0-9]{7,40}$/i)) {
                    l.remove();
                  }
                });
                commitMessage = clone.textContent.trim();
              }
            } else {
              // Method 2: Look for commit message class
              const msgEl = element.querySelector('.commit-message') ||
                           element.querySelector('[class*="message"]') ||
                           element.querySelector('p') ||
                           element.querySelector('span');
              if (msgEl) {
                commitMessage = msgEl.textContent.trim();
              } else {
                // Method 3: Get all text
                commitMessage = element.textContent.trim();
              }
            }
            
            commitMessage = commitMessage.replace(/\s+/g, ' ').trim();
            
            // Skip if empty or already processed
            if (!commitMessage || processedMessages.has(commitMessage)) {
              return;
            }
            
            processedMessages.add(commitMessage);
            
            // Extract task ID
            const match = commitMessage.match(TASK_ID_PATTERN);
            if (match) {
              const taskId = match[1].toUpperCase();
              taskIds.add(taskId);
              
              if (!taskDetails.has(taskId)) {
                taskDetails.set(taskId, {
                  id: taskId,
                  commits: []
                });
              }
              
              const commitLink = element.querySelector('a[href*="/commit/"]');
              taskDetails.get(taskId).commits.push({
                message: commitMessage,
                url: commitLink ? commitLink.href : null
              });
            }
          });
          break; // Found commits with this selector, no need to try others
        }
      }
    }

    // Strategy 3: Look in timeline/activity feed
    if (taskIds.size === 0) {
      const timelineItems = document.querySelectorAll('div[class*="TimelineItem"]');
      timelineItems.forEach(item => {
        const commitLink = item.querySelector('a[href*="/commit/"]');
        if (commitLink) {
          let commitMessage = '';
          const messageEl = item.querySelector('p') || 
                           item.querySelector('span[class*="message"]') ||
                           commitLink.nextElementSibling;
          
          if (messageEl) {
            commitMessage = messageEl.textContent.trim();
          } else {
            commitMessage = commitLink.textContent.trim();
          }
          
          commitMessage = commitMessage.replace(/\s+/g, ' ').trim();
          
          if (commitMessage && !processedMessages.has(commitMessage)) {
            processedMessages.add(commitMessage);
            const match = commitMessage.match(TASK_ID_PATTERN);
            if (match) {
              const taskId = match[1].toUpperCase();
              taskIds.add(taskId);
              
              if (!taskDetails.has(taskId)) {
                taskDetails.set(taskId, {
                  id: taskId,
                  commits: []
                });
              }
              
              taskDetails.get(taskId).commits.push({
                message: commitMessage,
                url: commitLink.href
              });
            }
          }
        }
      });
    }

    return { taskIds: Array.from(taskIds).sort(), taskDetails };
  }

  // Convert Map to plain object for JSON serialization
  function mapToObject(map) {
    const obj = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  // Get task data and return it in a format suitable for the popup
  function getTaskData() {
    const { taskIds, taskDetails } = extractTaskIds();
    return {
      taskIds,
      taskDetails: mapToObject(taskDetails)
    };
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTasks') {
      // Check if we're on a PR page
      if (!window.location.pathname.match(/\/pull\/\d+/)) {
        sendResponse({ success: false, error: 'Not on a PR page' });
        return true;
      }

      // Extract tasks and send response
      try {
        const data = getTaskData();
        sendResponse({ success: true, data });
      } catch (error) {
        console.error('Error extracting tasks:', error);
        sendResponse({ success: false, error: error.message });
      }
      
      return true; // Indicates we will send a response asynchronously
    }
  });

  // Initialize - ensure we're ready to respond to messages
  function init() {
    // Check if we're on a PR page
    if (!window.location.pathname.match(/\/pull\/\d+/)) {
      return;
    }

    // Pre-extract tasks to ensure they're ready when popup opens
    // This helps with performance when the popup requests data
    setTimeout(() => {
      getTaskData();
    }, 1500);

    // Listen for navigation changes (GitHub uses SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        if (url.match(/\/pull\/\d+/)) {
          // Pre-extract tasks for the new page
          setTimeout(() => {
            getTaskData();
          }, 1500);
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

