// PR Helper - Popup Script

(function() {
  'use strict';

  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const contentEl = document.getElementById('content');
  const taskListEl = document.getElementById('task-list');
  const taskCountEl = document.getElementById('task-count');
  const copyBtn = document.getElementById('copy-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  // Request task data from content script
  function requestTaskData() {
    // Show loading state
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    contentEl.style.display = 'none';

    // Get current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        showError();
        return;
      }

      const tab = tabs[0];
      
      // Check if we're on a GitHub PR page
      if (!tab.url || !tab.url.match(/github\.com\/.*\/pull\/\d+/)) {
        showError();
        return;
      }

      // Send message to content script to extract tasks
      chrome.tabs.sendMessage(tab.id, { action: 'getTasks' }, (response) => {
        if (chrome.runtime.lastError) {
          // Try to inject content script if it's not loaded
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }).then(() => {
            // Wait a bit and try again
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'getTasks' }, handleResponse);
            }, 500);
          }).catch(() => {
            showError();
          });
          return;
        }

        handleResponse(response);
      });
    });
  }

  function handleResponse(response) {
    loadingEl.style.display = 'none';

    if (!response || !response.success) {
      showError();
      return;
    }

    const { taskIds, taskDetails } = response.data || {};

    if (!taskIds || taskIds.length === 0) {
      showEmpty();
      return;
    }

    showTasks(taskIds, taskDetails);
  }

  function showError() {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    contentEl.style.display = 'none';
  }

  function showEmpty() {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    contentEl.style.display = 'block';
    taskCountEl.textContent = 'No task IDs found';
    taskListEl.innerHTML = '<li class="empty-message">No task IDs found in commit messages.</li>';
    copyBtn.style.display = 'none';
  }

  function showTasks(taskIds, taskDetails) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    contentEl.style.display = 'block';
    copyBtn.style.display = 'block';

    // Update task count
    taskCountEl.textContent = `${taskIds.length} unique task${taskIds.length !== 1 ? 's' : ''} found`;

    // Clear and populate task list
    taskListEl.innerHTML = '';
    taskIds.forEach(taskId => {
      const listItem = document.createElement('li');
      listItem.className = 'task-item';
      
      const taskInfo = taskDetails && taskDetails[taskId];
      const commitCount = taskInfo ? taskInfo.commits.length : 0;
      
      listItem.innerHTML = `
        <span class="task-id">${taskId}</span>
        <span class="commit-count">${commitCount} commit${commitCount !== 1 ? 's' : ''}</span>
      `;
      
      taskListEl.appendChild(listItem);
    });
  }

  // Copy button handler
  copyBtn.addEventListener('click', () => {
    const taskItems = Array.from(taskListEl.querySelectorAll('.task-id'));
    const taskIds = taskItems.map(item => item.textContent);
    const text = taskIds.join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  });

  // Refresh button handler
  refreshBtn.addEventListener('click', () => {
    requestTaskData();
  });

  // Load tasks when popup opens
  requestTaskData();
})();

