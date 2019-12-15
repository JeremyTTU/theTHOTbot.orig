import { HelixUser, HelixFollow } from 'twitch';
import Memoize from 'memoizee';
import async = require("async");
import Globals from './globals';
import { HelixFollowData } from 'twitch/lib/API/Helix/User/HelixFollow';
import Queues from './queues';
import Utils from './utils';
import Stream from './stream';
import { Channel } from './channels';
import Display from './display';

export class UserFollow {
    private _data: HelixFollowData;

    constructor(helixFollowData: HelixFollowData) {
        this._data = helixFollowData;
    }

    public get _id() {
        return { from_id: this._data.from_id, to_id: this._data.to_id };
    }

    public get from_id() {
        return this._data.from_id;
    }

    public get from_name() {
        return this._data.from_name;
    }

    public get to_id() {
        return this._data.to_id;
    }

    public get to_name() {
        return this._data.to_name;
    }

    public get followed_at() {
        return this._data.followed_at;
    }

    dbObject = () => {
        return {
            _id: this._id,
            from_id: this.from_id,
            from_name: this.from_name,
            to_id: this.to_id,
            to_name: this.to_name,
            followed_at: this.followed_at
        }
    };
}

export default class User {
    static Items: Map<string, User> = new Map<string, User>();

    private data: any = null;
    public channel: Channel = null;
    public name: string = null;
    public id: string = null;
    public userFollowsUpdated: Date = null;
    public followsUserUpdated: Date = null;

    doc = () => {
        var o = { _id: this.data.id };

        Object.getOwnPropertyNames(this.data).forEach(v => {
            var dataValue = Reflect.get(this.data, v);
            Reflect.defineProperty(o, v, { value: dataValue, enumerable: true });
        });

        Reflect.deleteProperty(o, 'id');

        return o;
    }

    static fromUsername = (username: string, callback: Function = null) => {
        if (User.Items.has(username)) return;

        try {
            var user = new User();
            user.name = username;
            Globals.Qs.GetUserByName.push(user.name, (data: any, err: Error) => {
                if (err !== undefined)
                Display.debug(err.message);
                else {
                    if (data != null) {
                        if (data._data !== undefined) {
                            user.data = data._data;
                            user.id = user.data.id;
                            user.save();
                        }
                        else {
                            user.data = data;
                            user.id = user.data.id;
                        }

                        User.Items.set(user.name, user);

                        if (callback != null)
                            callback(user);
                    }
                }
            });
        }
        catch (err) {

        }
    }

    private hasHelixData = () => this.data != null;

    private static add = (name: string) => {
        var user = new User();
        user.name = name;
        User.Items.set(name, user);
        return user;
    }

    static loadFromDatabase = async () => {
        var pageSize = 10;
        var pageNumber = 0;

        var users = await Globals.DB.collection('users').find({}).skip(pageNumber * pageSize).limit(pageSize).toArray();

        while (users.length > 0) {
            users.forEach((u) => {
                User.Items.set(u.login, u);
                if (User.Items.size % 1000 == 0)
                    Display.debug(`Imported ${User.Items.size} users`);
            });

            pageNumber++;

            users = await Globals.DB.collection('users').find({}).skip(pageNumber * pageSize).limit(pageSize).toArray();
        }

        User.Items.forEach(u => {
            if (u.userFollowsUpdated === undefined)
                Globals.Qs.GetUserFollows.push(u, User.updateUserFollows);
            if (u.followsUserUpdated === undefined)
                Globals.Qs.GetFollowsUser.push(u, User.updateFollowsUser);
        });
    }

    static updateFollowsUser = async (user: User, err: Error) => {
        await Globals.DB.collection('users').updateOne({ _id: user.id }, { $set: { followsUserUpdated: new Date() } }, { upsert: true });
    }

    static updateUserFollows = async (user: User, err: Error) => {
        await Globals.DB.collection('users').updateOne({ _id: user.id }, { $set: { userFollowsUpdated: new Date() } }, { upsert: true });
    }

    save = async () => {
        var d = this.doc();
        await Globals.DB.collection('users').updateOne(
            { _id: d._id },
            { $set: d },
            { upsert: true }
        );
    }

    static count() {
        return User.Items.size;
    }

    static getUser(username: string) {
        return User.Items.get(username);
    }

    static contains(username: string) {
        return User.Items.has(username);
    }
}