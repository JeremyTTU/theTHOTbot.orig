// NPM Installed Modules
import uuid = require('uuid/v4');

// Local Modules
import Globals from './globals';
import User from './user';
import Clients from './clients';
import Channels from './channels';
import Messaging from './messaging';
import Game from './game';
import Display from './display';
import Jackbox from './jackbox';

process.title = "theTHOTbot - " + uuid.toString().split('-')[0].substr(0, 4);

Globals.Initialize(async () => {
    Display.start();

    Display.debug(`Running from directory ~> ${process.cwd()}`);
    await Clients.TwitchLogin();
    await Clients.ChatLogin();
    await Clients.PubSubLogin();
    Jackbox.Initialize();

    Messaging.attachListeners(Globals.C);

    Globals.Conf.Users.forEach(u => Channels.join(u));

    var games = await Game.getGamesByName(Globals.Conf.Games);
    games.forEach(game => {
        Globals.Qs.GetStreamsByGame.push(game, Channels.fromGame);
    });

    await User.loadFromDatabase();
    Display.debug(`Users loaded from database: ${User.Items.size}`);

    Display.debug("Waiting for commands...");
});