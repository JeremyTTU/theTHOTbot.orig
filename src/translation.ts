import { v3 } from '@google-cloud/translate';
const translate = new v3.TranslationServiceClient();

export default class Translation {
    static _translate = null;

    static async translate(text: string, source:string, target: string) {
        let translations = await translate.translateText({contents: [text],sourceLanguageCode: source,targetLanguageCode: target});
        return translations[0].translations;
    }
}