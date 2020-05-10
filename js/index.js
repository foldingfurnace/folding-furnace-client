'use strict';

const { ipcRenderer } = require('electron');
let $ = require('jquery');


const COMMAND = {
    'SHOW_LOGIN': () => {
        $("#loginModal").modal('show');
    },
    'HIDE_LOGIN': () => {
        $("#loginModal").modal('hide');
    },
    'SHOW_ERROR': (arg) => {
        $("#errorMessage").text(arg.message);
        $("#errorAlert").show();
    },
};

ipcRenderer.on('command', (event, arg) => {
    let fn = COMMAND[arg.command];

    if (fn) {
        fn(arg);
    }
});


ipcRenderer.on('login-response', (event, arg) => {
    if (!arg.status) {
        $("#loginWarning").text(arg.message);
        $("#loginAlert").show();
    } else {
        $("#loginModal").modal('hide');
    }

    showLoginSpinner(false);
});


// TODO: this waits on an async, maybe not what we want
function login (username, password) {
    return ipcRenderer.send('login', {username, password});
}


function showLoginSpinner (state) {
    if (state) {
        $("#loginSpinner").removeClass('d-none');
    } else {
        $("#loginSpinner").addClass('d-none');
    }
}


$(document).ready(function () {
    $("#loginForm").submit((e) => {
        let username = $("#loginUsername").val();
        let password = $("#loginPassword").val();

        // start spinner
        showLoginSpinner(true);
        login(username, password);

        // cancels the submit event
        return false;
    });

    $("#resetToken").click(() => {
        ipcRenderer.send('reset-token', '');
    });
});
