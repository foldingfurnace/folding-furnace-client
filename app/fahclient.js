'use strict';

const net = require('net');


const DEFAULT_FAH_HOSTNAME = 'localhost';
const DEFAULT_FAH_PORT = 36330;


class FAHClient {
    constructor ({host=DEFAULT_FAH_HOSTNAME, port=DEFAULT_FAH_PORT, dataCallback, err}) {
        this.host = host;
        this.port = port;
        this.socket = new net.Socket();
        this.dataCallback = dataCallback;
        this.err = err;
        this.connected = false;
    }

    connect () {
        this.socket.connect(this.port, this.host, () => {
            this.connected = true;
            console.log(`Connected to ${this.host}:${this.port}`);

            this.socket.on('data', (data) => {
                let parsed = parsePyonMessage(data.toString().trim());

                if (data.length > 0) {
                    return this.dataCallback(parsed);
                }
            });

            this.socket.write('updates add 2 1 $slot-info\n');
        });

        this.socket.on('error', (err) => {
            this.socket.destroy();
            this.connected = false;

            console.log(`An error occurred on FAH socket: ${err}`);
        });
    }

    send (message) {
        console.log(`Sending ${message} to FAH...`)

        if (!message.endsWith('\n')) {
            message += '\n';
        }
        
        this.socket.write(message);
    }
};

function parsePyonMessage (message) {
    if (!message.includes('PyON')) {
        return [];
    }

    // Parse out only the pertinent JSON parsable parts
    message = message.substring(
        message.indexOf('PyON'),
        message.indexOf('---') - 1,
    );

    message = message
        .substring(message.indexOf('\n') + 1)
        .replace(/False/g, 'false').replace(/None/g, 'null');
    
    return JSON.parse(message);
}


module.exports = {
    FAHClient: FAHClient
};
// PyON 1 slots
// [
//   {
//     "id": "00",
//     "status": "RUNNING",
//     "description": "cpu:11",
//     "options": {"paused": "false"},
//     "reason": "",
//     "idle": False
//   },
//   {
//     "id": "01",
//     "status": "RUNNING",
//     "description": "gpu:0:TU106 [Geforce RTX 2060]",
//     "options": {"paused": "false"},
//     "reason": "",
//     "idle": False
//   }
// ]