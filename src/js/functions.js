/*
** MyPomodoro.  A simple pomodoro countdown timer.
** Copyright (C) 2020  Andŕes Felipe Moreno Sarria
**
** This program is free software: you can redistribute it and/or modify
** it under the terms of the GNU General Public License as published by
** the Free Software Foundation, either version 3 of the License, or
** (at your option) any later version.
**
** This program is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
** GNU General Public License for more details.
**
** You should have received a copy of the GNU General Public License
** along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/

const {ipcRenderer} = require("electron");
const fs = require("fs-extra");

// The title division.
var titleDiv = document.getElementById("Title");

// The timer division.
var timerDiv = document.getElementById("Timer");
var timer;

// The buttons.
var buttonsDiv = document.getElementById("Buttons");
var startButton = document.getElementById("Start");
var resetButton = document.getElementById("Reset");
var configButton = document.getElementById("Config");

// The ToDo list
var todoTitle = document.getElementById("TODO-TITLE");
var todoList = document.getElementById("CHECK-LIST");

// Is running flags.
var isRunning = false;
var isPaused = false;

// Rounds or cycle
var round;

// Time variable
var time;

// Secuence variables
var secuence;
var secuenceColour;
var secuenceTitle;

/**
* This function update the colours of the application.

 * @param {array} colours The value of the colour.
*/
function updatePomodoroColours(colour) {
  titleDiv.parentElement.style.background = colour;
  timerDiv.parentElement.style.background = colour;
  todoTitle.style.background = colour;
}

/**
* This function update the timer.

 * @param {int} time The value for the timer in milliseconds.

*/
function updatePomodoroTimer(time) {
  // Convert the time integer into minutes and seconds.
  var minutes;
  if (time < 60 * 60 * 1000) {
    minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
  } else {
    minutes = 60;
  }

  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  var seconds = Math.floor((time % (1000 * 60)) / 1000);

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  // Set the new timer value.
  timerDiv.innerText = minutes + ":" + seconds;
}

/**
* This function reset the timer.

 * @param {str} file The configuration file.
*/
function resetPomodoroTimer(file) {
  isRunning = false;

  // Read the configuration file.
  fs.readJson(file, (err, configObj) => {
    if (err) {
      throw err;
    }

    // Reset title.
    titleDiv.innerText = "Pomodoro";

    // Reset colours.
    updatePomodoroColours("#dd5555");

    // Reset timer.
    updatePomodoroTimer(configObj.work * 60 * 1000);
  });
}

/**
* This function starts the timer.
*/
function startTimer() {
  timer = setInterval(() => {
    time -= 1000;
    updatePomodoroTimer(time);

    if (time <= 0) {
      ipcRenderer.send("NOTIFICATION", secuenceTitle[round]);
      round += 1;

      if (round < secuence.length) {

        time = secuence[round] * 60 * 1000;

        titleDiv.innerText = secuenceTitle[round];

        updatePomodoroColours(secuenceColour[round]);
        updatePomodoroTimer(time);

      } else {
        ipcRenderer.send("RESET");
      }

    }
  }, 1000);
}

// Get all delete buttons of the table.
var buttons = document.getElementsByClassName("button");

// Add an event to all the buttons.
for (var button of buttons) {
  button.addEventListener("click", (event) => {
    var parNode = event.target.id;
    ipcRenderer.send(parNode);
  });
}

/**
* This function send information abaut a item in the todo list.

 * @param {node} items The compĺete ToDo list.
*/
function sendItem(items) {
  updateCheckItems();

  todoItems = {};

  for (var item of items) {
    todoItems[item.id] = [item.innerHTML, item.children[1].value];
  }

  ipcRenderer.send(
    "UPDATE-TODO-LIST",
    todoItems
  );
}

/**
* This Funtion update the id of the ToDo list items.
*/
function updateCheckItems() {
  // Get all list items.
  var checkRows = document.getElementsByClassName("check-row");
  var idCount = 0;

  for (var checkRow of checkRows) {
    checkRow.id = idCount;
    idCount++;
  }
}

/**
* This Funtion add event handlers for all the check items in the application.
*/
function addCheckItemEvents() {
  // Get all list items.
  var checkRows = document.getElementsByClassName("check-row");
  var idCount = 0;

  for (var checkRow of checkRows) {
    // Event for check box.
    checkRow.children[0].addEventListener("click", (event) => {
      var parNode = event.target;

      if (parNode.classList.contains("todo")) {
        parNode.classList.remove("todo");
        parNode.classList.add("doing");
      } else if (parNode.classList.contains("doing")) {
        parNode.classList.remove("doing");
        parNode.classList.add("done");
      } else {
        parNode.classList.remove("done");
        parNode.classList.add("todo");
      }

      sendItem(todoList.children);
    });

    // Event for input label.
    checkRow.children[1].addEventListener("input", (event) => {
      sendItem(todoList.children);
    });

    // Event for remove button.
    checkRow.children[2].addEventListener("click", (event) => {
      var removedItem = event.target.parentElement;
      removedItem.remove();
      sendItem(todoList.children);
    });
  }
}

/**
* This list initialize the ToDo list.

 * @param {str} todoFile The json file with the todo list.
 * @param {node} todoList Node of the ToDo list.
*/
function initTodoList(todoFile, todoList) {
  // Read the ToDo list file.
  fs.readJson(todoFile, (err, todoObj) => {
    if (err) {
      throw err;
    }

    // Add all elements that are in the json file to the ToDo list.
    for (var item in todoObj) {
      if (todoObj[item]) {
        todoList.innerHTML += "<div id=\"" + item +
        "\"class=\"full-width check-row\">" +
        todoObj[item][0] +
        "</div>";
      }
    }

    // Update task labels.
    updateTodoList(todoFile);
    // Update id numeration.
    updateCheckItems();
    // Add items events.
    addCheckItemEvents();
  });
}

/**
* This list update the ToDo list.

 * @param {str} todoFile The json file with the todo list.
*/
function updateTodoList(todoFile) {
  // Read the ToDo list file.
  fs.readJson(todoFile, (err, todoObj) => {
    if (err) {
      throw err;
    }

    // Fill tasks labels.
    for (var item in todoObj) {
      if (todoObj[item]) {
        var checkListItem = document.getElementById(item);
        checkListItem.children[1].value = todoObj[item][1];
      }
    }
  });
}
