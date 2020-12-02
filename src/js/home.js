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

* @param {array} colours The value of the colours.
*/
function updatePomodoroColours(colours) {
  titleDiv.parentElement.style.background = colours[0];
  timerDiv.parentElement.style.background = colours[0];
  todoTitle.style.background = colours[0];
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
    updatePomodoroColours(["#dd5555", "#ee9999"]);

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
* This Funtion add event handlers for all the check items in the application.
*/
function updateCheckItems() {
  // Get all delete buttons of the table.
  var checks = document.getElementsByClassName("item-check");

  // Add an event to all the buttons.
  for (var check of checks) {
    check.addEventListener("click", (event) => {
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

    });
  }

  // Get all delete buttons of the table.
  var removeButtons = document.getElementsByClassName("remove-item");

  // Add an event to all the buttons.
  for (var removeButton of removeButtons) {
    removeButton.addEventListener("click", (event) => {
      event.target.parentElement.remove();
    });
  }
}

// This event start the timer.
ipcRenderer.on("START", (event, value) => {
  if (!isRunning) {
    isRunning = true;

    // Read the configuration file.
    fs.readJson(value, (err, configObj) => {
      if (err) {
        throw err;
      }

      // Set the pomodoro-rest array.
      var aux = [configObj.work, configObj.sBreak];
      var auxColour = [["#dd5555", "#ee9999"], ["#5555dd", "#9999ee"]];
      var auxTitle = ["Pomodoro", "Short Break"];

      secuence = aux;
      secuenceColour = auxColour;
      secuenceTitle = auxTitle;

      for (var i = 0; i < configObj.pomodoros - 1; i++) {
        secuence = secuence.concat(aux);
        secuenceColour = secuenceColour.concat(auxColour);
        secuenceTitle = secuenceTitle.concat(auxTitle);
      }

      // Remove the last short rest to add the long rest.
      secuence.pop(secuence.length - 1);
      secuenceColour.pop(secuenceColour.length - 1);
      secuenceTitle.pop(secuenceTitle.length - 1);

      secuence = secuence.concat(configObj.lBreak);
      secuenceColour = secuenceColour.concat([["#55dd55", "#99ee99"]]);
      secuenceTitle = secuenceTitle.concat("Long Break");

      aux = secuence;
      auxColour = secuenceColour;
      auxTitle = secuenceTitle;

      for (var i = 0; i < configObj.pomodoros - 1; i++) {
        secuence = secuence.concat(aux);
        secuenceColour = secuenceColour.concat(auxColour);
        secuenceTitle = secuenceTitle.concat(auxTitle);
      }

      // Set round to 0, it means that is the first cycle
      round = 0;

      // Set time to the initial value
      time = secuence[round] * 60 * 1000;

      updatePomodoroTimer(time);

      // Start the timer.
      startTimer();
    });
  } else if (isPaused) {
    // Start the timer.
    isPaused = false;
    startTimer();
  }
});

// This event pause the timer.
ipcRenderer.on("PAUSE", (event, value) => {
  clearInterval(timer);
  isPaused = true;
});

// This event reset the timer.
ipcRenderer.on("RESET", (event, value) => {
  clearInterval(timer);
  resetPomodoroTimer(value);
});

// This event add an item to the ToDo list.
ipcRenderer.on("ADD-ITEM", (event, value) => {
  item = "<div class=\"full-width\">" +
  "<div class=\"item-check pointer float-left todo\"></div>\n" +
  "<input type=\"text\" class=\"item-label float-left\"/>\n" +
  "<img src=\"assets/removeButton.svg\"" +
  " class=\"button list-button float-left remove-item\"/>" +
  "</div>";

  todoList.innerHTML += item;

  updateCheckItems();
});

// Reset the timer when the window is ready.
ipcRenderer.send("RESET");
