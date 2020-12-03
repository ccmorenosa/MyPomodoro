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
      var auxColour = ["#dd5555", "#5555dd"];
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
      secuenceColour = secuenceColour.concat(["#55dd55"]);
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
  item = "<div class=\"full-width check-row\">" +
  "<div class=\"item-check pointer float-left todo\"></div>\n" +
  "<input type=\"text\" class=\"item-label float-left\"/>\n" +
  "<img src=\"assets/removeButton.svg\"" +
  " class=\"button list-button float-left remove-item\"/>" +
  "</div>";

  todoList.innerHTML += item;

  // Update id numeration.
  updateCheckItems();
  // Add items events.
  addCheckItemEvents();
  // Update task labels.
  updateTodoList(value);
});

// This event initialize the ToDo list.
ipcRenderer.on("INIT-TODO-LIST", (event, value) => {
  initTodoList(value, todoList);
});
