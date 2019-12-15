import Token from './token';
import Globals from './globals';
import TwitchClient from 'twitch';
import ChatClient from 'twitch-chat-client';
import PubSubClient, { PubSubWhisperMessage } from 'twitch-pubsub-client';
import Display from './display';

export default class Clients {
    static TwitchLogin = async () => {
        try {
            Display.debug("Logging into Twitch API");
            var token = new Token();

            if (token.hasExpired())
                await token.refresh(Globals.Conf.ClientID, Globals.Conf.ClientSK);

            Globals.T = await TwitchClient.withCredentials(Globals.Conf.ClientID, token.accessToken, [
                'chat_login', 'chat:read', 'chat:edit', 'user_follows_edit', 'user_read', 'whispers:edit', 'whispers:read'
            ], {
                clientSecret: Globals.Conf.ClientSK,
                refreshToken: token.refreshToken,
                expiry: token.expiryDate === null ? null : new Date(token.expiryDate),
                onRefresh: async ({
                    accessToken,
                    refreshToken,
                    expiryDate
                }) => {
                    token.accessToken = accessToken;
                    token.refreshToken = refreshToken;
                    token.expiryDate = expiryDate;
                    token.save();
                }
            });

            Display.debug("Successfully logged into Twitch API");
        }
        catch (err) {
            console.error(err);
        }
    }

    static ChatLogin = async () => {
        try {

            Globals.C = await ChatClient.forTwitchClient(Globals.T, { webSocket: true, ssl: true, requestMembershipEvents: false, legacyScopes: true, readOnly: false });

            Display.debug("Connecting to IRC Server");
            await Globals.C.connect();

            Display.debug("Registering to IRC Server");
            await Globals.C.waitForRegistration();

            Display.debug("User has been registered");
        }
        catch (err) {
            console.error(err);
        }
    }

    static PubSubLogin = async () => {
        try {
            await Globals.P.registerUserListener(Globals.T);
            var me = await Globals.T.helix.users.getMe(false);
            const listener = await Globals.P.onWhisper(me.id, (message: PubSubWhisperMessage) => {
                Display.debug(`----- ${message} -----`);
            });
        } catch (err) {

        }
    }
}