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

const electron = require("electron");
const {app, BrowserWindow, ipcMain} = electron;
const path = require("path");
const url = require("url");
const fs = require("fs-extra");

// Declare all windows.
var mainWin;
var processor;

// Declare the variable for the data directory.
var dataDir;

// Declare the variable for the configuration file.
var configFile;

/**
* This function creates the main window.
*
* It also will create the processor that will most of the process of the
* application and the database.
*/
function createWindow () {
  // Create the browser mainWindow.
  mainWin = new BrowserWindow({
    width: 600,
    minWidth: 600,
    height: 600,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWin.maximize();

  // and load the index.html of the app.
  mainWin.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }));

  processor = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  processor.loadURL(url.format({
    pathname: path.join(__dirname, "processor/processor.html"),
    protocol: "file:",
    slashes: true
  }));

  dataDir = app.getPath("userData");
  configFile = path.join(dataDir, "config.json");

  fs.pathExistsSync(dataDir, (err, exists) => {
    if (err) {
      throw err;
    }

    if (!exists) {
      fs.mkdirSync(dataDir, (dErr) => {
        if (dErr) {
          throw dErr;
        }
      });
    }
  });

  fs.pathExists(configFile, (err, exists) => {
    if (err) {
      throw err;
    }

    if (!exists) {
      var config = {
        "work": 25,
        "sBreak": 5,
        "lBreak": 25,
        "pomodoros": 3,
        "repetitions": 3
      };

      fs.writeJsonSync(configFile, config, (wErr) => {
        if (wErr) {
          throw wErr;
        }
      });
    }

    mainWin.send("RESET", configFile);

  });

  // Open the DevTools.
  mainWin.webContents.openDevTools();
  processor.webContents.openDevTools();

  mainWin.on("close", () => {
    mainWin = null;
    processor = null;
    app.quit();
  });

}

// This avoid to open most that one window.
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWin) {
      if (mainWin.isMinimized()) {
        mainWin.restore();
      }
      mainWin.focus();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  app.whenReady().then(createWindow);
}

// This event start the timer.
ipcMain.on("START", (event, value) => {
  mainWin.send("START", configFile);
});

// This event reset the timer.
ipcMain.on("RESET", (event, value) => {
  mainWin.send("RESET", configFile);
});

// This event open the configuration form.
ipcMain.on("CONFIG", (event, value) => {
  formWindow = new BrowserWindow({
    width: 300,
    height: 400,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  formWindow.loadURL(url.format({
    pathname: path.join(__dirname,"forms/config/index.html"),
    protocol: "file:",
    slashes: true
  }));

  formWindow.on("close",  () => {
    formWindow=null;
  });
});

ipcMain.on("CONFIG-DONE", (event, value) => {
  formWindow.close();

  var config = {
    "work": value[0],
    "sBreak": value[1],
    "lBreak": value[2],
    "pomodoros": value[3],
    "repetitions": value[4]
  };

  fs.writeJsonSync(configFile, config, (wErr) => {
    if (wErr) {
      throw wErr;
    }
  });

  mainWin.send("RESET", configFile);
});
