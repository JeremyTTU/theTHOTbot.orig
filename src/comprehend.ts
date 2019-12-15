import { Comprehend as _Comprehend } from 'aws-sdk';
import Display from './display';

var comprehend = new _Comprehend({
    region: "us-east-1"
})

export default class Comprehend {
    static sentiment(strings, callback) {
        var params = {
            LanguageCode: 'en',
            TextList: strings
        };
        comprehend.batchDetectSentiment(params, function (err, data) {
            if (err) Display.debug(err.message); // an error occurred
            else callback(data); // successful response
        });
    }
}