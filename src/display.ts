const Table = require('cli-table3');
import {
    ScreenBuffer,
    TextBuffer,
    ScreenBufferHD
} from 'terminal-kit';
import Queues, {
    QueueStats
} from './queues';
import Globals from './globals';
import Channels from './channels';
import User from './user';
import Messaging from './messaging';
const term = require('terminal-kit').terminal;

export default class Display {
    private static _timeout: NodeJS.Timeout = null;
    private static Screen: ScreenBuffer = null;
    private static Debug: TextBuffer = null;
    private static Background: TextBuffer = null;
    private static Messages: TextBuffer = null;
    private static Queues: TextBuffer = null;
    private static _messageQueue: Array<string> = new Array<string>();
    private static _debugQueue: Array<string> = new Array<string>();

    static start = () => {
        term.clear();

        Display.Screen = new ScreenBuffer({
            dst: term
        });

        Display.Messages = new TextBuffer({
            dst: Display.Screen,
            height: 10,
            width: term.width - 5,
            x: 2,
            y: term.height - 11,
            wrap: false
        });

        Display.Debug = new TextBuffer({
            dst: Display.Screen,
            height: 10,
            width: (term.width / 2) - 5,
            x: (term.width / 2) + 2,
            y: 2,
            wrap: false
        });

        Display.Background = new TextBuffer({
            dst: Display.Screen,
            x: 0,
            y: 0
        });

        Display.Queues = new TextBuffer({
            dst: Display.Screen,
            height: 10,
            width: term.width/2 - 5,
            x: 2,
            y: 2
        });

        Display.Background.move(0, 0);

        var box = '';
        var lineTop = '┌' + '─'.repeat(term.width - 2) + '┐';
        var lineBot = '└' + '─'.repeat(term.width - 2) + '┘';
        var space = '│' + ' '.repeat(term.width - 2) + '│';
        box = lineTop + '\r\n' + (space + '\r\n').repeat(term.height - 2) + lineBot;

        Display.Background.setText(box, true);
        Display.Background.draw();

        Globals.Qs.on('stats', (d: Array<QueueStats>) => {
            var eh = d.reduce((a, b) => a = b.name.length > a.name.length ? b : a);
            var stats = d.map(o => `Name: ${o.name.padEnd(eh.name.length + 2, ' ')}   T: ${o.concurrency}   Q: ${o.payload}`).join("\r\n");
            var globalStats = `Channels: ${Channels.Items.size}     Users: ${User.Items.size}    Messages: ${Messaging.totalMessages}`;
            Display.Queues.setText(globalStats + '\r\n'.repeat(2) + stats,true);
            Display.Queues.draw();
        });

        setInterval(() => Display.Screen.draw(),200);
    }

    static message(channel: string, user: string, message: string) {
        var msg = `[${channel}] ^+${user}^:: ${message}`;

        if (this._messageQueue.length == 10)
            this._messageQueue.shift();

        this._messageQueue.push(msg);

        if (Display.Messages == null || Display.Screen == null) return;
        Display.Messages.setText(this._messageQueue.join("\r\n"),true);
        Display.Messages.draw();
    }

    static debug(message: string) {
        if (this._debugQueue.length == 10)
            this._debugQueue.shift();

        var date = new Date().toISOString().
            replace(/T/, ' ').      // replace T with a space
            replace(/\..+/, '').split(' ')[1];
        this._debugQueue.push(`${date}: ${message}`);

        if (Display.Messages == null || Display.Screen == null) return;

        Display.Debug.setText(this._debugQueue.join("\r\n"),true);
        Display.Debug.draw();
    }

    static warn(message: string) {
        if (this._debugQueue.length == 10)
            this._debugQueue.shift();

        this._debugQueue.push(`${new Date()}: ^Y${message}^:`);

        if (Display.Messages == null || Display.Screen == null) return;

        Display.Debug.setText(this._debugQueue.join("\r\n"),true);
        Display.Debug.draw();
    }

    static error(message: string) {
        if (this._debugQueue.length == 10)
            this._debugQueue.shift();

        this._debugQueue.push(`${new Date()}: ^r${message}^:`);

        if (Display.Messages == null || Display.Screen == null) return;

        Display.Debug.setText(this._debugQueue.join("\r\n"),true);
        Display.Debug.draw();
    }
}