import { Db, MongoClient } from 'mongodb';
import Globals from './globals';

export class Database {
    private static _database : Db = null;

    static Database = async () => {
        var database = await MongoClient.connect(Globals.Conf.DatabaseUri, { useUnifiedTopology: true });
        Database._database = database.db('thethotbot');
    }
}