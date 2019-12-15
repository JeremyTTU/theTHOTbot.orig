import async = require("async");
import Globals from "./globals";
import { Chatters, Chatrooms } from "./chatrooms";
import User from "./user";
import Stream from "./stream";
import Game from "./game";
import Display from "./display";

export class Channel {
    readonly name: string = null;
    user: User = null;
    stream: Stream = null;
    chatters: Chatters = null;
    game: Game = null;

    constructor(name: string) {
        this.name = name.replace("#", "").toLowerCase();
        User.fromUsername(name, this.assignUser);
    }

    assignUser = (user: any, err: Error) => {
        this.user = user;
        Stream.fromUserId(this.user.id, this.assignStream);
    }

    assignStream = (stream: any, err: Error) => {
        this.stream = stream;
        if (stream.game_id !== undefined)
            this.game = Game.Items.get(stream.game_id);
    }
}

export default class Channels {
    static Items: Map<string, Channel> = new Map<string, Channel>();

    private static addChannel = (channel: Channel, error: Error) => {
        if (error !== undefined)
        Display.debug(`ERROR: ${error.message}`);
        else {
            Channels.Items.set(channel.name, channel);
            Chatrooms.start(channel);
            Display.debug(`Channel has been joined '${channel.name}'`);
        }
    }

    static fromGame = async (streams: any[], error: Error) => {
        if (streams != null && streams.length > 0) {
            Display.debug(`Found ${streams.length} for '${Game.lookup(streams[0].game_id).name}'`);
            streams.forEach(stream => Channels.join(stream.user_name));
        }
    }

    static join = async (name: string) => {
        var cleanChannel = Globals.CleanCan(name);
        Globals.Qs.JoinChannel.push(cleanChannel, Channels.addChannel);
    };

    static part = async (name: string) => {
        var cleanChannel = Globals.CleanCan(name);
        if (Channels.Items.has(cleanChannel)) {
            Channels.Items.delete(cleanChannel);
        }
        else {
            throw new Error(`Not joined to channel '${cleanChannel}'`);
        }
    }
}