const axios = require('axios');


const URL = 'https://api.lo3skunk.works'


// TODO: integrate JWT into this client?
class FFApi {
    constructor (url) {
        this.url = url || URL;
    }

    async login (email, password) {
        return (await axios.post(`${this.url}/login`, {username: email, password: password})).data.access_token;
    }

    async getCommands (token) {
        let cfg = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        return (await axios.get(`${this.url}/commands`, cfg)).data.commands;
    }
}

module.exports = {
    FFApi: FFApi,
};



// {
//     'commands': [
//         {
//             'command': 'state',
//         }
//     ]
// }
