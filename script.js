/**
 * ITUE301 Practical 9: In-Memory Caching & Query Optimization Demo
 * Technologies: HTML5, CSS3, Vanilla JavaScript (ES6+)
 * Communicates with Express + MongoDB + node-cache API on http://localhost:5000
 */

const API_BASE_URL = "http://localhost:5000";

// Cache Statistics State (Frontend-only)
const cacheStats = {
  hits: 0,
  misses: 0,
  total: 0
};

// Currently inspected task ID for single-task cache demonstration
let currentInspectedTaskId = null;

// DOM Element References
const elements = {
  // Navigation / Header
  serverStatusBadge: document.getElementById("serverStatusBadge"),
  headerClearCacheBtn: document.getElementById("headerClearCacheBtn"),
  headerRefreshTasksBtn: document.getElementById("headerRefreshTasksBtn"),
  toastContainer: document.getElementById("toastContainer"),

  // Hero Cache Status Panel
  cacheStatusPanel: document.getElementById("cacheStatusPanel"),
  cacheHeroBadge: document.getElementById("cacheHeroBadge"),
  cacheStatusText: document.getElementById("cacheStatusText"),
  cacheStatusIcon: document.getElementById("cacheStatusIcon"),
  cacheSourceBanner: document.getElementById("cacheSourceBanner"),
  cacheSourceText: document.getElementById("cacheSourceText"),
  cacheLastEndpoint: document.getElementById("cacheLastEndpoint"),
  cacheLastKey: document.getElementById("cacheLastKey"),
  cacheLatency: document.getElementById("cacheLatency"),
  cacheIndicatorDisplay: document.querySelector(".cache-indicator-display"),
  clearCacheBtn: document.getElementById("clearCacheBtn"),
  demoRefreshBtn: document.getElementById("demoRefreshBtn"),

  // Statistics
  statHits: document.getElementById("statHits"),
  statMisses: document.getElementById("statMisses"),
  statTotal: document.getElementById("statTotal"),
  statHitRate: document.getElementById("statHitRate"),
  statBarLabel: document.getElementById("statBarLabel"),
  hitRateFill: document.getElementById("hitRateFill"),
  resetStatsBtn: document.getElementById("resetStatsBtn"),

  // Flow Diagram Branches
  branchYes: document.getElementById("branchYes"),
  branchNo: document.getElementById("branchNo"),
  flowStatusPill: document.getElementById("flowStatusPill"),

  // Task Creation Form
  createTaskForm: document.getElementById("createTaskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  taskCompleted: document.getElementById("taskCompleted"),
  addTaskBtn: document.getElementById("addTaskBtn"),

  // Task List
  refreshTasksBtn: document.getElementById("refreshTasksBtn"),
  tasksContainer: document.getElementById("tasksContainer"),
  tasksLoading: document.getElementById("tasksLoading"),
  tasksEmpty: document.getElementById("tasksEmpty"),
  tasksCountBadge: document.getElementById("tasksCountBadge"),

  // Single Task Modal
  taskModal: document.getElementById("taskModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  modalCloseActionBtn: document.getElementById("modalCloseActionBtn"),
  modalTaskTitle: document.getElementById("modalTaskTitle"),
  modalCacheBanner: document.getElementById("modalCacheBanner"),
  modalCacheSourceTag: document.getElementById("modalCacheSourceTag"),
  modalCacheLatency: document.getElementById("modalCacheLatency"),
  modalCacheStatusTitle: document.getElementById("modalCacheStatusTitle"),
  modalCacheDescription: document.getElementById("modalCacheDescription"),
  modalCacheKey: document.getElementById("modalCacheKey"),
  modalTaskStatus: document.getElementById("modalTaskStatus"),
  modalTaskDesc: document.getElementById("modalTaskDesc"),
  modalTaskId: document.getElementById("modalTaskId"),
  modalTaskCreated: document.getElementById("modalTaskCreated"),
  modalRefetchBtn: document.getElementById("modalRefetchBtn"),
  modalToggleBtn: document.getElementById("modalToggleBtn")
};

// ============================================================================
// Notification Toasts
// ============================================================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "warning") icon = "⚡";
  if (type === "danger") icon = "🗑️";

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// Cache Statistics Helpers
// ============================================================================
function recordCacheEvent(isHit) {
  if (isHit) {
    cacheStats.hits++;
  } else {
    cacheStats.misses++;
  }
  cacheStats.total++;
  updateStatsUI();
}

function updateStatsUI() {
  elements.statHits.textContent = cacheStats.hits;
  elements.statMisses.textContent = cacheStats.misses;
  elements.statTotal.textContent = cacheStats.total;

  const hitRate = cacheStats.total === 0 
    ? 0 
    : ((cacheStats.hits / cacheStats.total) * 100).toFixed(1);

  elements.statHitRate.textContent = `${hitRate}%`;
  elements.statBarLabel.textContent = `${hitRate}%`;
  elements.hitRateFill.style.width = `${hitRate}%`;
}

function resetStatistics() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.total = 0;
  updateStatsUI();
  showToast("Statistics reset to zero", "info");
}

// ============================================================================
// Cache Status Demonstration Panel Updater
// ============================================================================
function updateCachePanel({ isHit, source, latencyMs, endpoint, cacheKey }) {
  // Update record stats
  recordCacheEvent(isHit);

  // Remove existing states
  elements.cacheStatusPanel.classList.remove("state-hit", "state-miss");
  elements.cacheIndicatorDisplay.classList.remove("hit-active", "miss-active");
  elements.cacheHeroBadge.classList.remove("badge-hit", "badge-miss");

  // Highlight Flow Diagram
  elements.branchYes.classList.remove("active-flow");
  elements.branchNo.classList.remove("active-flow");

  if (isHit) {
    // CACHE HIT (Green)
    elements.cacheStatusPanel.classList.add("state-hit");
    elements.cacheIndicatorDisplay.classList.add("hit-active");
    elements.cacheHeroBadge.classList.add("badge-hit");
    elements.cacheHeroBadge.textContent = "CACHE HIT";

    elements.cacheStatusText.textContent = "HIT";
    elements.cacheSourceText.textContent = "Cache (node-cache RAM)";
    elements.cacheLatency.className = "meta-latency fast";
    elements.cacheLatency.textContent = `${latencyMs} ms (Lightning fast)`;

    // Update Icon
    elements.cacheStatusIcon.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    `;

    // Highlight Flow Diagram YES Branch
    elements.branchYes.classList.add("active-flow");
    elements.flowStatusPill.textContent = "Last: CACHE HIT (RAM)";
  } else {
    // CACHE MISS (Orange / Red)
    elements.cacheStatusPanel.classList.add("state-miss");
    elements.cacheIndicatorDisplay.classList.add("miss-active");
    elements.cacheHeroBadge.classList.add("badge-miss");
    elements.cacheHeroBadge.textContent = "CACHE MISS";

    elements.cacheStatusText.textContent = "MISS";
    elements.cacheSourceText.textContent = "MongoDB (Disk / Atlas)";
    elements.cacheLatency.className = "meta-latency slow";
    elements.cacheLatency.textContent = `${latencyMs} ms (Database query)`;

    // Update Icon
    elements.cacheStatusIcon.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      </svg>
    `;

    // Highlight Flow Diagram NO Branch
    elements.branchNo.classList.add("active-flow");
    elements.flowStatusPill.textContent = "Last: CACHE MISS (MongoDB)";
  }

  elements.cacheLastEndpoint.textContent = endpoint;
  elements.cacheLastKey.textContent = cacheKey;
}

// ============================================================================
// API Calls
// ============================================================================

// 1. GET /tasks - Fetch all tasks with cache status measurement
async function fetchTasks() {
  elements.tasksLoading.classList.remove("hidden");
  elements.tasksEmpty.classList.add("hidden");

  const startTime = performance.now();

  try {
    const res = await fetch(`${API_BASE_URL}/tasks`);
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const json = await res.json();
    
    // Support both wrapped response { source, data } and raw array fallback
    let source = "mongodb";
    let tasks = [];

    if (json && typeof json === "object" && !Array.isArray(json)) {
      source = (json.source || "mongodb").toLowerCase();
      tasks = Array.isArray(json.data) ? json.data : [];
    } else if (Array.isArray(json)) {
      tasks = json;
    }

    const isHit = source === "cache";

    // Update Hero Cache Panel
    updateCachePanel({
      isHit,
      source: isHit ? "Cache" : "MongoDB",
      latencyMs: latency,
      endpoint: "GET /tasks",
      cacheKey: "all_tasks"
    });

    renderTaskList(tasks);
    updateServerStatus(true);
  } catch (error) {
    console.error("fetchTasks error:", error);
    showToast(`Error fetching tasks: ${error.message}`, "danger");
    updateServerStatus(false);
  } finally {
    elements.tasksLoading.classList.add("hidden");
  }
}

// 2. GET /tasks/:id - Single task cache demonstration
async function fetchSingleTask(taskId) {
  currentInspectedTaskId = taskId;
  const startTime = performance.now();

  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const json = await res.json();

    let source = "mongodb";
    let task = null;

    if (json && typeof json === "object" && json.data) {
      source = (json.source || "mongodb").toLowerCase();
      task = json.data;
    } else {
      task = json;
    }

    const isHit = source === "cache";

    // Also update main statistics
    recordCacheEvent(isHit);

    // Update Modal View
    renderTaskModal({
      task,
      isHit,
      source,
      latencyMs: latency,
      cacheKey: `task_${taskId}`
    });

    elements.taskModal.classList.remove("hidden");
  } catch (error) {
    console.error("fetchSingleTask error:", error);
    showToast(`Failed to load task details: ${error.message}`, "danger");
  }
}

// 3. POST /tasks - Create a task and refresh list
async function createTask(e) {
  e.preventDefault();

  const title = elements.taskTitle.value.trim();
  const description = elements.taskDescription.value.trim();
  const completed = elements.taskCompleted.checked;

  if (!title) {
    showToast("Please enter a task title", "warning");
    return;
  }

  elements.addTaskBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, completed })
    });

    if (!res.ok) {
      throw new Error(`Failed to create task (HTTP ${res.status})`);
    }

    showToast("Task created successfully! (Cache invalidated)", "success");
    elements.createTaskForm.reset();

    // Automatically refresh task list - this will trigger a CACHE MISS from MongoDB!
    await fetchTasks();
  } catch (error) {
    console.error("createTask error:", error);
    showToast(`Error creating task: ${error.message}`, "danger");
  } finally {
    elements.addTaskBtn.disabled = false;
  }
}

// 4. PUT /tasks/:id - Update task completed status
async function toggleTaskStatus(taskId, currentStatus) {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !currentStatus })
    });

    if (!res.ok) {
      throw new Error(`Update failed (HTTP ${res.status})`);
    }

    showToast("Task updated! (Cache invalidated)", "success");

    // If modal is open for this task, re-fetch it
    if (currentInspectedTaskId === taskId && !elements.taskModal.classList.contains("hidden")) {
      await fetchSingleTask(taskId);
    }

    await fetchTasks();
  } catch (error) {
    console.error("toggleTaskStatus error:", error);
    showToast(`Error updating task: ${error.message}`, "danger");
  }
}

// 5. DELETE /tasks/:id - Delete task
async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error(`Delete failed (HTTP ${res.status})`);
    }

    showToast("Task deleted! (Cache invalidated)", "danger");

    // Close modal if deleted task is open
    if (currentInspectedTaskId === taskId) {
      closeModal();
    }

    await fetchTasks();
  } catch (error) {
    console.error("deleteTask error:", error);
    showToast(`Error deleting task: ${error.message}`, "danger");
  }
}

// 6. DELETE /cache - Clear all cache entries
async function clearAllCache() {
  try {
    const res = await fetch(`${API_BASE_URL}/cache`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error(`Clear cache failed (HTTP ${res.status})`);
    }

    // Update UI per requirement: "Cache cleared successfully"
    showToast("Cache cleared successfully", "warning");

    // Immediately refresh tasks to visibly show CACHE MISS from MongoDB!
    await fetchTasks();
  } catch (error) {
    console.error("clearAllCache error:", error);
    showToast(`Failed to clear cache: ${error.message}`, "danger");
  }
}

// ============================================================================
// Renderers
// ============================================================================

function renderTaskList(tasks) {
  elements.tasksContainer.innerHTML = "";
  elements.tasksCountBadge.textContent = tasks.length;

  if (tasks.length === 0) {
    elements.tasksEmpty.classList.remove("hidden");
    return;
  }

  elements.tasksEmpty.classList.add("hidden");

  tasks.forEach((task) => {
    const taskCard = document.createElement("article");
    taskCard.className = `task-card ${task.completed ? "is-completed" : ""}`;
    taskCard.dataset.id = task._id;

    const formattedDate = task.createdAt 
      ? new Date(task.createdAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "Just now";

    taskCard.innerHTML = `
      <div class="task-card-header">
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
        <span class="status-pill ${task.completed ? "status-completed" : "status-pending"}">
          ${task.completed ? "✓ Completed" : "● Pending"}
        </span>
      </div>

      ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ""}

      <div class="task-meta-bar">
        <div>
          <span>ID: </span>
          <code class="task-id-tag" title="Click to copy ID" onclick="navigator.clipboard.writeText('${task._id}'); window.showToastMessage('ID copied to clipboard', 'info');">
            ${task._id.slice(-6)}...
          </code>
          <span style="margin-left: 0.5rem;">📅 ${formattedDate}</span>
        </div>

        <div class="task-actions">
          <button class="btn btn-secondary btn-sm btn-view" title="Inspect individual task cache" data-id="${task._id}">
            👁️ View
          </button>
          <button class="btn ${task.completed ? "btn-outline" : "btn-primary"} btn-sm btn-toggle" data-id="${task._id}" data-completed="${task.completed}">
            ${task.completed ? "Mark Incomplete" : "Complete"}
          </button>
          <button class="btn btn-danger-outline btn-sm btn-delete" data-id="${task._id}" title="Delete task">
            🗑️
          </button>
        </div>
      </div>
    `;

    elements.tasksContainer.appendChild(taskCard);
  });

  // Attach event listeners for card action buttons
  elements.tasksContainer.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", () => fetchSingleTask(btn.dataset.id));
  });

  elements.tasksContainer.querySelectorAll(".btn-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const isCompleted = btn.dataset.completed === "true";
      toggleTaskStatus(btn.dataset.id, isCompleted);
    });
  });

  elements.tasksContainer.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteTask(btn.dataset.id));
  });
}

function renderTaskModal({ task, isHit, source, latencyMs, cacheKey }) {
  elements.modalTaskTitle.textContent = task.title;
  elements.modalTaskId.textContent = task._id;
  elements.modalTaskDesc.textContent = task.description || "(No description provided)";
  elements.modalTaskCreated.textContent = task.createdAt 
    ? new Date(task.createdAt).toLocaleString() 
    : "--";

  // Task Status Pill
  elements.modalTaskStatus.className = `status-pill ${task.completed ? "status-completed" : "status-pending"}`;
  elements.modalTaskStatus.textContent = task.completed ? "✓ Completed" : "● Pending";

  // Toggle button text in modal
  elements.modalToggleBtn.textContent = task.completed ? "Mark Incomplete" : "Mark as Completed";

  // Cache Banner Styling
  elements.modalCacheBanner.className = `single-cache-banner ${isHit ? "modal-hit" : "modal-miss"}`;
  elements.modalCacheKey.textContent = cacheKey;
  elements.modalCacheLatency.textContent = `${latencyMs} ms`;

  if (isHit) {
    elements.modalCacheSourceTag.textContent = "SOURCE: CACHE";
    elements.modalCacheStatusTitle.textContent = "CACHE HIT";
    elements.modalCacheDescription.textContent = `Served directly from memory cache for key "${cacheKey}". MongoDB was not queried.`;
  } else {
    elements.modalCacheSourceTag.textContent = "SOURCE: MONGODB";
    elements.modalCacheStatusTitle.textContent = "CACHE MISS";
    elements.modalCacheDescription.textContent = `Retrieved from MongoDB and saved into NodeCache with key "${cacheKey}" (TTL: 60s).`;
  }
}

function closeModal() {
  elements.taskModal.classList.add("hidden");
  currentInspectedTaskId = null;
}

// Helper: Escape HTML to prevent XSS
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global hook for inline clipboard toast
window.showToastMessage = (msg, type) => showToast(msg, type);

// ============================================================================
// Server Connection Health Check
// ============================================================================
async function updateServerStatus(isOnline) {
  if (isOnline) {
    elements.serverStatusBadge.querySelector(".status-dot").className = "status-dot pulse";
    elements.serverStatusBadge.querySelector(".status-label").innerHTML = `Backend: <strong>${API_BASE_URL}</strong> (Online)`;
  } else {
    elements.serverStatusBadge.querySelector(".status-dot").className = "status-dot offline";
    elements.serverStatusBadge.querySelector(".status-label").innerHTML = `Backend: <strong>${API_BASE_URL}</strong> (Offline)`;
  }
}

// ============================================================================
// Event Listeners Initialization
// ============================================================================
function initEventListeners() {
  // Create Task Form
  elements.createTaskForm.addEventListener("submit", createTask);

  // Clear Cache Buttons (Header & Panel)
  elements.clearCacheBtn.addEventListener("click", clearAllCache);
  elements.headerClearCacheBtn.addEventListener("click", clearAllCache);

  // Refresh Tasks Buttons (Header, Main, Demo)
  elements.refreshTasksBtn.addEventListener("click", fetchTasks);
  elements.headerRefreshTasksBtn.addEventListener("click", fetchTasks);
  elements.demoRefreshBtn.addEventListener("click", fetchTasks);

  // Reset Statistics Button
  elements.resetStatsBtn.addEventListener("click", resetStatistics);

  // Modal Controls
  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.modalCloseActionBtn.addEventListener("click", closeModal);
  elements.taskModal.addEventListener("click", (e) => {
    if (e.target === elements.taskModal) closeModal();
  });

  // Re-fetch Single Task inside Modal (Demonstrates MISS -> HIT)
  elements.modalRefetchBtn.addEventListener("click", () => {
    if (currentInspectedTaskId) {
      fetchSingleTask(currentInspectedTaskId);
    }
  });

  // Toggle Completed inside Modal (Demonstrates Invalidation)
  elements.modalToggleBtn.addEventListener("click", async () => {
    if (currentInspectedTaskId) {
      const isCompletedNow = elements.modalTaskStatus.textContent.includes("Completed");
      await toggleTaskStatus(currentInspectedTaskId, isCompletedNow);
    }
  });

  // Keyboard escape to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !elements.taskModal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

// ============================================================================
// Application Bootstrap
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  updateStatsUI();
  fetchTasks();
});
