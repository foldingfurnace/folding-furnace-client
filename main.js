'use strict';

const { app, ipcMain } = require('electron');
const { Window } = require('./app/window');
const { JWTKeyRing } = require('./app/keyring');
const { FFApi } = require('./app/ffapi');


const POLL_INTERVAL = 3000;

let mainWindow = null;
let keyring = null;
let api = null;
let background = null;


function runInBackground() {
  const fn = async () => {
    let jwt = await keyring.getJwt(); // TODO: this throws
    let commands = null;


    try {
      commands = await api.getCommands(jwt);
    } catch (err) {
      await mainWindow.showErrorMessage(`Retrieving commands from API resulted in error ${err}`);
      return;
    }

    for (let index in commands) {
      let command = commands[index].command;

      if (command == 'on') {
        console.log("Turning FAH on");
      }
    }
  };

  return setInterval(fn, POLL_INTERVAL);
}

app.on('ready', async () => {
  mainWindow = new Window(`file://${__dirname}/index.html`);
  mainWindow.on('close', () => app.quit());
  keyring = new JWTKeyRing();
  api = new FFApi();

  mainWindow.on('ready-to-show', async () => {
    let jwt = await keyring.getJwt();

    if (jwt == null) {
      await mainWindow.showLoginScreen();
    } else {
      background = runInBackground(); // start background loop which retrieves commands
    }

    mainWindow.show();
  });
});


ipcMain.on('login', async (event, arg) => {
  let ret = {
    status: true,
    message: null
  };

  try {
    let token = await api.login(arg.username, arg.password);

    await keyring.setJwt(token);

    // start background thread
    background = runInBackground();
  } catch (err) {
    if (err.response && err.response.status == 401) {
      ret = {
        status: false,
        message: "Login attempt failed; please check your credentials and try again",
      };
    } else {
      ret = {
        status: false,
        message: `An unknown error occurred attempting to login: ${err}`,
      };
    }
  }

  event.reply('login-response', ret);
});


ipcMain.on('reset-token', async (event, arg) => {
  await keyring.deleteJwt();

  // stop the background loop if running
  if (background) {
    clearInterval(background);
    background = null;
  }

  await mainWindow.showLoginScreen();
});


// window is just a controller; main controls the logic and window just updates to reflect

// startup:
// fetch token via keyring
// if !token => login

// confirm token via /token/status (with token)
// if 404 => login

// start
// display main page

// login:
// call endpoint
// store in keyring


// // Quit when all windows are closed.
// app.on('window-all-closed', function () {
//   // On OS X it is common for applications and their menu bar
//   // to stay active until the user quits explicitly with Cmd + Q
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })
