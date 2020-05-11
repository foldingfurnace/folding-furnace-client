'use strict';

const { app, ipcMain } = require('electron');
const { Window } = require('./app/window');
const { JWTKeyRing } = require('./app/keyring');
const { FFApi } = require('./app/ffapi');
const { FAHClient } = require('./app/fahclient');


const POLL_INTERVAL = 3000;
const FAH_CONNECTION_HEALTHCHECK = 1000;

let mainWindow = null;
let keyring = null;
let api = null;
let background = null;
let fahTimer = null;
let fahClient = null;


const TRANSLATE = {
  'on': 'unpause',
  'off': 'pause',
};


function fahConnection() {
  const fn = () => {
    if (!fahClient.connected) {
      console.log("Connecting to FAH...");
      fahClient.connect();
    }
  };

  return setInterval(fn, FAH_CONNECTION_HEALTHCHECK);
}


function runInBackground() {
  const fn = async () => {
    let now = Date.now();
    let jwt = await keyring.getJwt(); // TODO: this throws
    let commands = null;

    try {
      commands = await api.getCommands(jwt);
    } catch (err) {
      await mainWindow.showErrorMessage(`Retrieving commands from API resulted in error ${err}`);
      return;
    }

    await mainWindow.showLastPolled((new Date()).toString());

    for (let index in commands) {
      let command = commands[index].command;

      try {
        await fahClient.send(TRANSLATE[command]);
      } catch (err) {
        await mainWindow.showErrorMessage(`Sending command to FAH result in error ${err}`);
      }

      await mainWindow.showLastUpdated((new Date()).toString());
    }
  };

  console.log('run-in-background');
  return setInterval(fn, POLL_INTERVAL);
}


async function onSlotUpdate (slots) {
  await mainWindow.showSlots(slots);
}


app.on('ready', async () => {
  mainWindow = new Window(`file://${__dirname}/index.html`);
  mainWindow.on('close', () => app.quit());

  keyring = new JWTKeyRing();
  api = new FFApi();
  fahClient = new FAHClient({dataCallback: onSlotUpdate});

  mainWindow.on('ready-to-show', async () => {
    let jwt = await keyring.getJwt();

    fahTimer = fahConnection();
    
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