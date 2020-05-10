'use strict';

const keytar = require('keytar');


const SERVICE = "folding-furnace-a";
const ACCOUNT = "folding-furnace-account";


class JWTKeyRing {
    constructor () {
        this.jwt = null;
    }

    async getJwt () {
        if (!this.jwt) {
            try {
                this.jwt = await keytar.getPassword(SERVICE, ACCOUNT);
            } catch (err) {
                // todo: can I just pass this?
            }
        }

        return this.jwt;
    }

    async setJwt (jwt) {
        return keytar.setPassword(SERVICE, ACCOUNT, jwt)
    }

    async deleteJwt () {
        return keytar.deletePassword(SERVICE, ACCOUNT);
    }
}


module.exports = {
    JWTKeyRing: JWTKeyRing
}

