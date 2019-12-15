import { readFileSync, writeFileSync} from 'fs-extra';
import fetch from 'node-fetch';
import Display from './display';

export default class Token {
    accessToken :string;
    refreshToken : string;
    expiryDate: Date;

    constructor() {
        Display.debug("Loading OAuth Token");
        var tokenData = JSON.parse(readFileSync('./conf/token.json').toString());
        this.accessToken = tokenData.accessToken;
        this.refreshToken = tokenData.refreshToken;
        this.expiryDate = tokenData.expiryTimestamp;
    }

    hasExpired() {
        return this.expiryDate < new Date();
    }

    async refresh(clientId:string, clientSk:string) {
        Display.debug("Refreshing OAuth Token");

        const url = `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${this.refreshToken}&client_id=${clientId}&client_secret=${clientSk}`;
        try {
            const response = await fetch(url, {
                method: 'POST'
            });
            if (response.ok) {
                const json = await response.json();
                this.accessToken = json.access_token;
                this.refreshToken = json.refresh_token;
                this.expiryDate = new Date(new Date().getTime() + parseInt(json.expires_in) * 1000);
                this.save();
                Display.debug(json);
            }
        } catch (err) {
            Display.debug(err.message);
        }
    }

    save() {
        Display.debug("Saving OAuth Token");
        writeFileSync('./conf/token.json', JSON.stringify(this, null, 4), 'UTF-8');
    }
}