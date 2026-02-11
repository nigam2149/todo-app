// Retrieve todo from local storage or initialize an empty array
let todo = JSON.parse(localStorage.getItem("todo")) || [];
let currentFilter = "all";
let searchQuery = "";

// Get DOM elements
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const todoCount = document.getElementById("todoCount");
const completedCount = document.getElementById("completedCount");
const addButton = document.querySelector(".btn");
const deleteButton = document.getElementById("deleteButton");
const deleteCompletedButton = document.getElementById("deleteCompletedButton");
const prioritySelect = document.getElementById("prioritySelect");
const categorySelect = document.getElementById("categorySelect");
const dueDateInput = document.getElementById("dueDateInput");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  addButton.addEventListener("click", addTask);
  
  todoInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTask();
    }
  });
  
  deleteButton.addEventListener("click", deleteAllTasks);
  deleteCompletedButton.addEventListener("click", deleteCompletedTasks);
  
  // Search functionality
  searchInput.addEventListener("input", function() {
    searchQuery = this.value.toLowerCase();
    displayTasks();
  });
  
  // Filter functionality
  filterButtons.forEach(btn => {
    btn.addEventListener("click", function() {
      filterButtons.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      currentFilter = this.getAttribute("data-filter");
      displayTasks();
    });
  });
  
  displayTasks();
});

function addTask() {
  const newTask = todoInput.value.trim();
  if (newTask !== "") {
    const task = {
      text: newTask,
      disabled: false,
      priority: prioritySelect.value,
      category: categorySelect.value,
      dueDate: dueDateInput.value,
      createdAt: new Date().toISOString()
    };
    
    todo.push(task);
    saveToLocalStorage();
    
    // Reset inputs
    todoInput.value = "";
    prioritySelect.value = "medium";
    categorySelect.value = "personal";
    dueDateInput.value = "";
    
    displayTasks();
  }
}

function displayTasks() {
  todoList.innerHTML = "";
  
  // Filter tasks based on current filter and search query
  let filteredTasks = todo.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchQuery);
    
    switch(currentFilter) {
      case "active":
        return !item.disabled && matchesSearch;
      case "completed":
        return item.disabled && matchesSearch;
      case "high":
        return item.priority === "high" && matchesSearch;
      default:
        return matchesSearch;
    }
  });
  
  // Sort by priority (high > medium > low) and then by due date
  filteredTasks.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });
  
  filteredTasks.forEach((item, displayIndex) => {
    const actualIndex = todo.indexOf(item);
    const li = document.createElement("li");
    
    // Check if task is overdue
    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.disabled;
    
    li.innerHTML = `
      <div class="todo-item ${item.priority}-priority ${isOverdue ? 'overdue' : ''}">
        <div class="todo-main">
          <input type="checkbox" class="todo-checkbox" id="input-${actualIndex}" ${
      item.disabled ? "checked" : ""
    }>
          <div class="todo-content">
            <p id="todo-${actualIndex}" class="${
      item.disabled ? "disabled" : ""
    }" onclick="editTask(${actualIndex})">${item.text}</p>
            <div class="todo-meta">
              <span class="priority-badge ${item.priority}">${item.priority}</span>
              <span class="category-badge">${item.category}</span>
              ${item.dueDate ? `<span class="due-date ${isOverdue ? 'overdue-text' : ''}">${formatDate(item.dueDate)}</span>` : ''}
            </div>
          </div>
        </div>
        <button class="delete-btn" onclick="deleteTask(${actualIndex})">✕</button>
      </div>
    `;
    
    li.querySelector(".todo-checkbox").addEventListener("change", () =>
      toggleTask(actualIndex)
    );
    
    todoList.appendChild(li);
  });
  
  updateCounters();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset time part for comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const dateToCompare = new Date(date);
  dateToCompare.setHours(0, 0, 0, 0);
  
  if (dateToCompare.getTime() === today.getTime()) {
    return "Today";
  } else if (dateToCompare.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
}

function editTask(index) {
  const todoItem = document.getElementById(`todo-${index}`);
  const existingText = todo[index].text;
  const inputElement = document.createElement("input");
  
  inputElement.value = existingText;
  inputElement.className = "edit-input";
  todoItem.replaceWith(inputElement);
  inputElement.focus();
  
  inputElement.addEventListener("blur", function () {
    const updatedText = inputElement.value.trim();
    if (updatedText) {
      todo[index].text = updatedText;
      saveToLocalStorage();
    }
    displayTasks();
  });
  
  inputElement.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      inputElement.blur();
    }
  });
}

function toggleTask(index) {
  todo[index].disabled = !todo[index].disabled;
  saveToLocalStorage();
  displayTasks();
}

function deleteTask(index) {
  todo.splice(index, 1);
  saveToLocalStorage();
  displayTasks();
}

function deleteAllTasks() {
  if (confirm("Are you sure you want to delete all tasks?")) {
    todo = [];
    saveToLocalStorage();
    displayTasks();
  }
}

function deleteCompletedTasks() {
  const completedTasks = todo.filter(item => item.disabled).length;
  if (completedTasks === 0) {
    alert("No completed tasks to delete!");
    return;
  }
  
  if (confirm(`Delete ${completedTasks} completed task(s)?`)) {
    todo = todo.filter(item => !item.disabled);
    saveToLocalStorage();
    displayTasks();
  }
}

function updateCounters() {
  todoCount.textContent = todo.length;
  const completed = todo.filter(item => item.disabled).length;
  completedCount.textContent = completed;
}

function saveToLocalStorage() {
  localStorage.setItem("todo", JSON.stringify(todo));
}