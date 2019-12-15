import { readFileSync, writeFileSync, moveSync } from 'fs-extra';
import Display from './display';

export default class Config {
    DatabaseUri: string = null;
    ClientID: string = null;
    ClientSK: string = null;
    AwsAccessKey: string = null;
    AwsSecretKey: string = null;
    AwsDefaultRegion: string = null;
    Users: Array<string> = new Array<string>();
    Games: Array<string> = new Array<string>();
    Admins: Array<string> = new Array<string>();
    StreamKey = null;

    constructor() {
        this.load();
    }

    load = () => {
        try {
            Display.debug('Config.loadConfiguration');

            var config = JSON.parse(readFileSync('./conf/config.json').toString());
            this.DatabaseUri = config.DatabaseUri;
            this.ClientID = config.ClientID;
            this.ClientSK = config.ClientSK;
            this.StreamKey = config.StreamKey;
            this.AwsAccessKey = config.AwsAccessKey;
            this.AwsSecretKey = config.AwsSecretKey;
            this.AwsDefaultRegion = config.AwsDefaultRegion;
            config.Users.forEach((element: string) => {
                this.Users.push(element);
            });
            config.Games.forEach((element: string) => {
                this.Games.push(element);
            });
            config.Admins.forEach((element: string) => {
                this.Admins.push(element);
            });
            if (this.AwsAccessKey !== undefined && this.AwsSecretKey !== undefined && this.AwsDefaultRegion !== undefined) {
                process.env.AWS_ACCESS_KEY_ID = this.AwsAccessKey;
                process.env.AWS_SECRET_ACCESS_KEY = this.AwsSecretKey;
                process.env.AWS_DEFAULT_REGION = this.AwsDefaultRegion;
            }
        } catch (e) {
            console.error(e);
        }
    }

    save = () => {
        Display.debug('Config.saveConfiguration')
        moveSync('./conf/config.json', `./conf/config-${new Date().getTime()}.json`);
        writeFileSync('./conf/config.json', JSON.stringify(this));
    }
}