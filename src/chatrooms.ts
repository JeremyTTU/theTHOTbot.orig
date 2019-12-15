import fetch from 'node-fetch';
import { EventEmitter } from 'events';
import Globals from './globals';
import { Channel } from './channels';
import User from './user';
import Display from './display';

export class Chatters {
    private _all: string[];
    private _eventEmitter: EventEmitter;
    private _name: string = null;

    admins: string[] = [];
    broadcaster: string[] = [];
    global_mods: string[] = [];
    moderators: string[] = [];
    staff: string[] = [];
    viewers: string[] = [];
    vips: string[] = [];
    hasBeenRefreshed = false;

    constructor(name: string) {
        this._name = name;
        this._eventEmitter = new EventEmitter();
        this.refresh();
    }

    refresh = async () => {
        var oldChatters = this.all;
        
        Display.debug(`Updating chatters for '${this._name}'`);

        const url = `https://tmi.twitch.tv/group/user/${this._name}/chatters`;
        await fetch(url).then(async (res) => {
            if (res.ok) {
                const json = (await res.json()).chatters;

                this.admins = json.admins;
                this.broadcaster = json.broadcaster;
                this.global_mods = json.global_mods;
                this.moderators = json.moderators;
                this.staff = json.staff;
                this.viewers = json.viewers;
                this.vips = json.vips;

                if (oldChatters != null) {
                    var part = Chatters.getPartingChatters(oldChatters, this.all);
                    var join = Chatters.getJoiningChatters(oldChatters, this.all);

                    // part.forEach((username) => this._eventEmitter.emit('onUserPart', username));
                    // join.forEach((username) => this._eventEmitter.emit('onUserJoin', username));
                    if (join.length > 0)
                        join.forEach((username) => User.fromUsername(username, null));
                }

                this.hasBeenRefreshed = true;
            }
        });
    }

    get all() {
        if (this._all == null || this.hasBeenRefreshed) {
            var result = [];
            [this.admins, this.broadcaster, this.global_mods, this.moderators, this.staff, this.viewers, this.vips].forEach((o) => {
                if (o != null) result = result.concat(o);
            });
            this._all = result;
        }
        return this._all;
    }

    private static getPartingChatters = (a: string[], b: string[]) => a.filter(o => !b.includes(o));

    private static getJoiningChatters = (a: string[], b: string[]) => b.filter(o => !a.includes(o));
}

export class Chatrooms {
    static Rooms: Map<string, Chatters> = new Map<string, Chatters>();
    private static _timers: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();

    updateAll = (callback: Function) => {
        Display.debug('Chatrooms.updateAll');

        Chatrooms.Rooms.forEach((chatters) => {
            chatters.refresh();
        });
        callback();
    }

    static has(channel: Channel) {
        return this._timers.has(channel.name);
    }

    static start(channel: Channel) {
        if (this.has(channel)) return;
        channel.chatters = new Chatters(channel.name);
        this._timers.set(channel.name, setInterval(() => channel.chatters.refresh(), 30000));
    }

    static stop(channel: Channel) {
        if (!this.has(channel)) return;
        clearInterval(this._timers.get(channel.name));
    }
}