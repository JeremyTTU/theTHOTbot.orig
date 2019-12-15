import TwitchClient from 'twitch';
import ChatClient from 'twitch-chat-client';
import WordSplitter from './wordsplitter';
import Config from './config';
import { EventEmitter } from 'events';
import { Db, MongoClient } from 'mongodb';
import User from './user';
import Queues from './queues';
import PubSubClient from 'twitch-pubsub-client';
import Display from './display';

export default class Globals {
    private static TwitchClient: TwitchClient;
    private static ChatClient: ChatClient;
    private static PubSubClient: PubSubClient;
    private static Database: Db;
    private static WordSplitter: WordSplitter;
    private static Config: Config;
    private static Queues: Queues;
    private static Events: Map<object, EventEmitter> = new Map<object, EventEmitter>();

    static async Initialize(callback : Function) {
        Globals.WordSplitter = new WordSplitter();
        Globals.Config = new Config();
        Globals.Queues = new Queues();

        var database = await MongoClient.connect(Globals.Conf.DatabaseUri, { useUnifiedTopology: true });
        Globals.Database = database.db('thethotbot');

        callback();
    }

    static set T(twitchClient : TwitchClient) {
        Globals.TwitchClient = twitchClient;
    }

    static set C(chatClient : ChatClient) {
        Globals.ChatClient = chatClient;
    }

    static set P(pubSubClient : PubSubClient) {
        Globals.PubSubClient = pubSubClient;
    }
    
    static get T() {
        return Globals.TwitchClient;
    }

    static get C() {
        return Globals.ChatClient;
    }

    static get P() {
        return Globals.PubSubClient;
    }

    static get DB() {
        return Globals.Database;
    }

    static get WS() {
        return Globals.WordSplitter;
    }

    static get Conf() {
        return Globals.Config;
    }

    static get Qs() {
        return Globals.Queues;
    }

    static CleanCan(channel: string) {
        return channel.replace("#", "").trim().toLowerCase();
    }
}