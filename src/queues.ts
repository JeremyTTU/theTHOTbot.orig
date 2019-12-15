import User, { UserFollow } from "./user";
import Globals from "./globals";
import Channels, { Channel } from "./channels";
import { AsyncResultCallback } from "async";
import async = require('async');
import EventEmitter = require('events');
import { HelixGame, HelixStream } from "twitch";
import Display from "./display";

export default class Queues {
    private Emitter = new EventEmitter();

    public GetUser: async.AsyncQueue<User> = null;
    public GetUserById: async.AsyncQueue<string> = null;
    public GetUserByName: async.AsyncQueue<string> = null;
    public GetUserFollows: async.AsyncQueue<User> = null;
    public GetFollowsUser: async.AsyncQueue<User> = null;
    public JoinChannel: async.AsyncQueue<string> = null;
    public GetStreamsByGame: async.AsyncQueue<HelixGame> = null;
    public GetStreamByUserId: async.AsyncQueue<string> = null;

    constructor() {
        this.GetStreamByUserId = async.queue(async (userid: string, callback: Function = null) => {
            var helixStream = await Globals.T.helix.streams.getStreamByUserId(userid);
            if (callback != null)
                callback(helixStream);
        }, 1);

        this.GetStreamsByGame = async.queue(async (game: HelixGame, callback: Function = null) => {
            var streams = [];
            var found = 0;
            var paged = Globals.T.helix.streams.getStreamsPaginated({ game: game.id });

            await paged.getNext();

            do {
                if (paged.current != null) {
                    paged.current.forEach(v => {
                        streams.push(v);
                        found++;
                    });
                }

                await paged.getNext();
            }
            while (streams.length != found)

            if (callback != null)
                callback(streams);
        }, 1);

        this.GetUserByName = async.queue(async (username: string, callback: Function = null) => {
            var dbUser = await Globals.DB.collection('users').findOne({ login: username });
            if (dbUser != null && callback != null) {
                callback(dbUser);
            }
            else {
                var helixUser = await Globals.T.helix.users.getUserByName(username);
                if (callback != null && callback != null)
                    callback(helixUser);
            }
        }, 4);

        this.GetUserById = async.queue(async (id: string, callback: Function = null) => {
            var helixUser = await Globals.T.helix.users.getUserById(id);
            if (callback != null)
                callback(helixUser);
        }, 1);

        this.GetUser = async.queue(async (user: User, callback: Function = null) => {
            var helixUser = await Globals.T.helix.users.getUserById(user.id);
            if (callback != null)
                callback(helixUser);
        }, 1);

        this.GetUserFollows = async.queue(async (user: User, callback: Function = null) => {
            var users = new Array();
            var added = 0;
            var pager = Globals.T.helix.users.getFollowsPaginated({ user: user.id });

            await pager.getNext();

            do {
                if (pager.current != null) {
                    pager.current.forEach((v) => {
                        users.push(new UserFollow(v).dbObject());
                        added++;
                    });
                }
                await pager.getNext();
            }
            while (users.length != added);

            if (users.length > 0)
                users.forEach(u => Globals.DB.collection('follows').updateOne({ _id: u._id }, { $set: u }, { upsert: true }));

            if (callback != null)
                callback(user);
        }, 2);

        this.GetFollowsUser = async.queue(async (user: User, callback: Function = null) => {
            var users = new Array();
            var added = 0;
            var pager = Globals.T.helix.users.getFollowsPaginated({ followedUser: user.id });

            await pager.getNext();

            do {
                if (pager.current != null) {
                    pager.current.forEach((v) => {
                        users.push(new UserFollow(v).dbObject());
                        added++;
                    });
                }
                await pager.getNext();
            }
            while (users.length != added);

            if (users.length > 0)
                users.forEach(u => Globals.DB.collection('follows').updateOne({ _id: u._id }, { $set: u }, { upsert: true }));

            if (callback != null)
                callback(user);
        }, 2);

        this.JoinChannel = async.queue(async (name: string, callback: Function = null) => {
            try {
                await Globals.C.join(name);
                if (callback != null)
                    setTimeout(() => callback(new Channel(name)),2000);
            }
            catch (err) {
                callback(null, err);
            }
        }, 2);

        setInterval(() => {
            var stats = this.generateStats();
            this.Emitter.emit('stats', stats);
        }, 1000);
    }

    private generateStats = () => {
        var stats = new Array();
        var props = Object.getOwnPropertyNames(this);

        props.forEach(v => {
            let queue = Reflect.get(this, v);
            if (queue.started !== undefined && queue.push !== undefined) {
                stats.push(new QueueStats(v, queue.concurrency, queue.length()));
            }
        });

        return stats;
    };

    on(eventName: string, data: any) {
        this.Emitter.on(eventName, data);
    }
}

export class QueueStats {
    name: string;
    concurrency: number;
    payload: number;

    constructor(name: string, concurrency: number, payload: number) {
        this.name = name;
        this.concurrency = concurrency;
        this.payload = payload;
    }
}