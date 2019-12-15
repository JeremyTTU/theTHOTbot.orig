import { HelixGame } from 'twitch';
import Globals from './globals';
import Stream from './stream';

export default class Game {
    static Items: Map<string, HelixGame> = new Map<string, HelixGame>();

    static getGamesByName = async (names: string[]) => {
        var games = await Globals.T.helix.games.getGamesByNames(names);
        if (games != null)
        await Game.updateDatabase(games);
        return games;
    }

    static updateDatabase = async (helixGames: HelixGame[]) => {
        helixGames.forEach((v) => {
            Game.Items.set(v.id, v);
            var o = { _id: v.id, name: v.name, box_art_url: v.boxArtUrl };
            Globals.DB.collection('games').updateOne(
                { _id: o._id }, { $set: o }, { upsert: true }
            );
        });
    }

    static lookup = (id: string) => {
        return Game.Items.get(id);
    }

    // static getStreamsByGame = async (game : HelixGame) => {
    //     Globals.Qs.GetStreamsByGame.push(game, Stream.fromGame);
    // }

    // addGames = async (games) => {
    //     this.getGameIds(games).then(this.getGameStreamsPaged).then(gameStreamsPaged => this.retrieveStreams(gameStreamsPaged));
    // }

    // retrieveStreams = async (gameStreamsPaged) => {
    //     var streamCount = 0;
    //     var viewerCount = 0;

    //     var streamList = new Map();

    //     await gameStreamsPaged.getNext();

    //     do {
    //         gameStreamsPaged.current.forEach(stream => {
    //             streamList.set(stream.id, {
    //                 joinMethod: joinStream,
    //                 queueObject: stream
    //             });
    //             viewerCount += stream.viewer_count;
    //             streamCount++;
    //         });
    //         await gameStreamsPaged.getNext();
    //     } while (streamList.size != streamCount)

    //     streamList.forEach(s => {
    //         joinQueue.push({
    //             joinMethod: s.joinMethod,
    //             queueObject: s.queueObject
    //         });
    //     });
    // }

    // update = async (names: string[]) => await Globals.Twitch.helix.games.getGamesByNames(names).then((games) => {
    //     games.forEach(game => {
    //         Globals.DB.collection('games').updateOne({
    //             id: game.id
    //         }, {
    //             $set: games
    //         }, {
    //             upsert: true
    //         });
    //     });
    //     return games;
    // }).then((helixGames) => helixGames.map(helixGame => helixGame.id));

    // getGameStreamsPaged = (gameIds: string) => Globals.Twitch.helix.streams.getStreamsPaginated({
    //     game: gameIds
    // });
}