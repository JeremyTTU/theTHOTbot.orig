import { HelixStream } from "twitch";
import Globals from "./globals";
import Display from "./display";

export default class Stream {
    static Items: Map<string, Stream> = new Map<string, Stream>();

    private data: any = null;

    public name: string = null;

    static fromUserId = (userid: string, callback: Function) => {
        var stream = new Stream();
        Globals.Qs.GetStreamByUserId.push(userid, (data: any, err: Error) => {
            if (err !== undefined)
                Display.debug(err.message);
            else {
                if (data != null) {
                    stream.data = data._data;
                    stream.save();
                }

                callback(stream);
            }
        });
    }

    static fromName = (name: string, callback: Function) => {
        var stream = new Stream();
        stream.name = name;
        Globals.Qs.GetStreamByUserId.push(name, stream.dataRetrieved);
        if (callback != null)
            callback(stream);
    }

    dataRetrieved = (data: any, err: Error) => {
        if (err !== undefined)
        Display.debug(err.message);
        else {
            if (data != null) {
                this.data = data._data;
                this.save();
            }
        }
    }



    doc = () => {
        var o = { _id: this.data.id };

        Object.getOwnPropertyNames(this.data).forEach(v => {
            var dataValue = Reflect.get(this.data, v);
            Reflect.defineProperty(o, v, { value: dataValue, enumerable: true });
        });

        Reflect.deleteProperty(o,'id');

        return o;
    }

    save = async () => {
        var o = this.doc();
        await Globals.DB.collection('streams').updateOne({ _id: o._id }, { $set: o }, { upsert: true });
    }
}