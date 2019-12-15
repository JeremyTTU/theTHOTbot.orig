import Comprehend from './comprehend';
import Globals from './globals';
import ChatClient from 'twitch-chat-client';
import Channels from './channels';
import User from './user';
import humanizeDuration = require('humanize-duration');
import Display from './display';
import Jackbox from './jackbox';
import Clients from './clients';

export default class Messaging {
    static totalMessages: number = 0;

    static attachListeners = (chatClient: ChatClient) => {
        setInterval(() => chatClient.pingCheck(), 30000);

        chatClient.onDisconnect(async (manually: boolean, reason: Error) => {
            Display.debug('Disconnection Occurred');
            setTimeout(() => Clients.ChatLogin(), 15000);
        });

        chatClient.onAnyMessage((message) => {
            Globals.DB.collection('raw').insertOne(message);
            Messaging.totalMessages++;
        });

        chatClient.onBan((channel, user, reason) => {
            Globals.DB.collection('bans').insertOne({
                timestamp: new Date(),
                channel: channel.slice(1),
                user: user
            });
        });

        chatClient.onMessageFailed((channel, reason) => {
            Display.debug(`Message Failed: ${reason}`);
        });

        chatClient.onNoPermission((channel, message) => {
            Display.warn(`No Permission: ${message}`);
        });

        chatClient.onJoin((channel, user) => {
            //Display.logMessage(`[${channel}] JOIN: ${user}`);
        });

        chatClient.onPart((channel, user) => {
            //Display.logMessage(`[${channel}] PART: ${user}`);
        });

        chatClient.onMessageRatelimit((channel, string) => {
            Display.warn("Rate Limiting Occurred");
        });

        chatClient.onPrivmsg(async (channel, user, message, raw) => {
            Display.message(channel, user, message);

            Globals.DB.collection('messages').insertOne({
                timestamp: new Date(),
                channel: channel.slice(1),
                user: user,
                type: 'normal',
                message: message
            });

            if (message[0] != '!') return;

            var split = message.split(' ');
            var command = split[0].substring(1, split[0].length).toUpperCase();
            var msg = split.slice(1).join(' ');

            switch (command) {
                case "THOT":
                    chatClient.say(channel, `theTHOTbot is on patrol...`);
                    break;
                case "BREAK":
                    var b = Globals.WS.parse(split[1]);
                    chatClient.say(channel, `Broken into '${b}'`)
                    break;
                case "TMP2":
                    var p = Jackbox.Search(msg);
                    if (p != null)
                        chatClient.say(channel, `The answer is '${p.answer}'`);
                    break;
                case "UPTIME":
                    chatClient.say(channel, "THOTbot has been running for " + humanizeDuration(Math.round(process.uptime() * 1000) / 1000 * 1000));
                    break;
                case "STATS":
                    chatClient.say(channel, `@${user} -> Channels: ${Channels.Items.size}, Users: ${User.Items.size}, Msgs: ${Messaging.totalMessages}`);
                    break;
                case "SCORE":
                    if (split.length != 2)
                        chatClient.say(channel, `@${user} -> The command is "!analyze username"`);
                    else {
                        var lame = await Globals.DB.collection('messages').find({
                            user: split[1].toLowerCase()
                        }).limit(25).sort({
                            timestamp: -1
                        });

                        var result = await lame.toArray();

                        Comprehend.sentiment(result.map((o) => o.message), (a, b) => {
                            var sentiments = a.ResultList.map(s => s.Sentiment);

                            var score = 0;

                            sentiments.forEach(s => {
                                if (s == "POSITIVE")
                                    score++;
                                else if (s == "NEGATIVE")
                                    score--;
                                else if (s == "MIXED")
                                    score = -score;
                            });

                            chatClient.say(channel, `@${user} -> The THOTScore™ for ${split[1]} is ${score}.`);
                        });
                    }
                    break;
                case "DETAILS":
                    if (split.length != 2)
                        chatClient.say(channel, `@${user} -> The command is "!details username"`);
                    else {
                        var target = await Globals.DB.collection('users').findOne({
                            login: split[1]
                        });
                        if (target === undefined) {
                            chatClient.say(channel, `@${target} -> no user found`);
                        } else {
                            var stats = `${target.display_name}`;
                            if (target.broadcaster_type != "")
                                stats += ` (${target.broadcaster_type})`;
                            stats += `, Views: ${target.view_count}`;
                            if (target.userFollowing !== undefined)
                                stats += `, Follows: ${target.userFollowing.length}`;
                            if (target.followsUser !== undefined)
                                stats += `, Following: ${target.followsUser.length}`;
                            chatClient.say(channel, `@${target} -> ${stats}`);
                        }
                    }
                    break;
            }
        });

        chatClient.onWhisper((user, message, raw) => {
            Display.message('WHISPER', user, message);

            Globals.DB.collection('whispers').insertOne({
                timestamp: new Date(),
                user: user,
                message: message
            });

            if (message[0] != '!') return;

            var split = message.split(' ');
            var command = split[0].substring(1, split[0].length).toUpperCase();
            var msg = split.slice(2).join(' ');
            var isAdmin = Globals.Conf.Admins.some(o => o.toString().toUpperCase() == user.toUpperCase());

            switch (command) {
                case "F":
                    if (!isAdmin) break;
                    var tochannel = split[1];
                    Globals.T.helix.users.getUserByName(tochannel).then(user => user.follow())
                        .then(() => chatClient.whisper(user, `Following channel '${split[1]}'`));
                    break;
                case "S":
                    if (!isAdmin) break;
                    var tochannel = split[1];
                    var tomessage = split.slice(2).join(' ');
                    chatClient.say(tochannel, tomessage);
                    break;
                case "G":
                    if (!isAdmin) break;
                    var tochannel = split[1];
                    chatClient.whisper(user, `Adding Game '${split[1]}'`);
                    break;
                case "J":
                    if (!isAdmin) break;
                    chatClient.whisper(user, `Joining channel '${split[1]}`);
                    break;
                case "L":
                    if (!isAdmin) break;
                    chatClient.whisper(user, `Leaving channel '${split[1]}`);
                    chatClient.part(split[1]);
                    break;
                case "ADD":
                    if (!isAdmin) break;
                    chatClient.whisper(user, `Adding potental THOT '${split[1]}' to watch...`);
                    break;
                case "DEL":
                    if (!isAdmin) break;
                    chatClient.whisper(user, `Deleting THOT '${split[1]}' from watch...`);
                    break;
                case "SRC":
                    if (!isAdmin) break;
                    // var channelList = Channels.Items.filter((o) => o.indexOf(split[1]) > -1);
                    // chatClient.whisper(user, `${channelList.length} Results: ${channelList.join(", ")}`);
                    break;
            }
        });
    };
}