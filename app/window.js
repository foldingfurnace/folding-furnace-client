'use strict';

const { BrowserWindow, shell } = require('electron');


class Window {
    constructor (url, options) {
        let defaults = {
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
            },
            show: false,
        };
        let opts = Object.assign({}, defaults, options);
        let ret = new BrowserWindow(opts);

        this.bWindow = new BrowserWindow(opts);
        this.bWindow.loadURL(url);

        // URL are redirected out of the application
        this.bWindow.webContents.on('will-navigate', (event, url) => {
            event.preventDefault()
            shell.openExternal(url)
        });
        //this.bWindow.webContents.openDevTools();
    }

    get instance () {
        return this.bWindow;
    }

    on (event, fn) {
        return this.instance.on(event, fn);
    }

    show () {
        return this.instance.show();
    }

    async hideLoginScreen () {
        this.bWindow.webContents.send('command', {command: 'HIDE_LOGIN'})
    }

    async showLoginScreen () {
        this.bWindow.webContents.send('command', {command: 'SHOW_LOGIN'})
    }

    async showErrorMessage (message) {
        this.bWindow.webContents.send('command', {command: 'SHOW_ERROR', message})
    }

    async showSlots (slots) {
        this.bWindow.webContents.send('command', {command: 'SHOW_SLOTS', message: slots})
    }

    async showLastPolled (timestamp) {
        this.bWindow.webContents.send('command', {command: 'SHOW_LAST_POLLED', message: timestamp});
    }

    async showLastUpdated (timestamp) {
        this.bWindow.webContents.send('command', {command: 'SHOW_LAST_UPDATE', message: timestamp});
    }
}


module.exports = {
    Window: Window,
};
