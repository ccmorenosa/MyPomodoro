/*
** MyPomodoro.  A simply pomodoro countdown timer.
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

const {ipcRenderer, shell} = require("electron");
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

// Is running flag.
var isRunning = false;

/**
* This function update the colours of the application.
*
* @param {array} colours The value of the colours.
*/
function updatePomodoroColours(colours) {
  titleDiv.parentElement.style.background = colours[0];
  timerDiv.parentElement.style.background = colours[0];
  buttonsDiv.style.background = colours[1];
}

/**
* This function update the timer.
*
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

  // Set the new timer value;
  timerDiv.innerText = minutes + ":" + seconds;
}

/**
* This function reset the timer.
*
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

// Add events for the buttons
// Get all delete buttons of the table.
var buttons = document.getElementsByClassName("button");

// Add an event to the delete buttons.
for (var button of buttons) {
  button.addEventListener("click", (event) => {
    var parNode = event.target.id;
    ipcRenderer.send(parNode);
  });
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

      // Set the pomodoro-rest array
      var aux = [configObj.work, configObj.sBreak];
      var auxColour = [["#dd5555", "#ee9999"], ["#5555dd", "#9999ee"]];
      var auxTitle = ["Pomodoro", "Short Break"];

      var secuence = aux;
      var secuenceColour = auxColour;
      var secuenceTitle = auxTitle;

      for (var i = 0; i < configObj.pomodoros; i++) {
        secuence = secuence.concat(aux);
        secuenceColour = secuenceColour.concat(auxColour);
        secuenceTitle = secuenceTitle.concat(auxTitle);
      }

      secuence.pop(secuence.length - 1);
      secuenceColour.pop(secuenceColour.length - 1);
      secuenceTitle.pop(secuenceTitle.length - 1);

      secuence = secuence.concat(configObj.lBreak);
      secuenceColour = secuenceColour.concat(["#55dd55", "#99ee99"]);
      secuenceTitle = secuenceTitle.concat("Long Break");

      aux = secuence;
      auxColour = secuenceColour;
      auxTitle = secuenceTitle;

      for (var i = 0; i < configObj.pomodoros; i++) {
        secuence = secuence.concat(aux);
        secuenceColour = secuenceColour.concat(auxColour);
        secuenceTitle = secuenceTitle.concat(auxTitle);
      }

      var round = 0;

      var time = secuence[round] * 60 * 1000;

      updatePomodoroTimer(time);

      timer = setInterval(() => {
        time -= 1000;
        updatePomodoroTimer(time);

        if (time <= 0) {
          round += 1;

          if (round < secuence.length) {

            time = secuence[round] * 60 * 1000;

            titleDiv.innerText = secuenceTitle[round];

            updatePomodoroColours(secuenceColour[round]);
            updatePomodoroTimer(time);

            shell.beep();
          } else {
            ipcRenderer.send("RESET");
          }

        }
      }, 1000);

    });
  }
});

// This event reset the timer.
ipcRenderer.on("RESET", (event, value) => {
  clearInterval(timer);
  resetPomodoroTimer(value);
});

// Reset the timer when the window is ready.
ipcRenderer.send("RESET");
