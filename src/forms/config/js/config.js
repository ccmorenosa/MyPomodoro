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

const {ipcRenderer} = require("electron");

var form = document.getElementById("config-form");

/**
* This function submit the form to create a new subject in the database.
*/
function configPomodoro() {
  console.log("a");
  var data = [
    form.children["Pomodoro"].value,
    form.children["sBreak"].value,
    form.children["lBreak"].value,
    form.children["nPomodoros"].value,
    form.children["Rounds"].value
  ];

  data = data.map((value) => {
    return Number(value);
  });

  ipcRenderer.send("CONFIG-DONE", data);
}

ipcRenderer.on("DEFAULT", (event, value) => {
  form.children["Pomodoro"].value = value[0];
  form.children["sBreak"].value = value[1];
  form.children["lBreak"].value = value[2];
  form.children["nPomodoros"].value = value[3];
  form.children["Rounds"].value = value[4];
});

ipcRenderer.send("DEFAULT");
