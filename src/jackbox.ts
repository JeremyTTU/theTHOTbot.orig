import { readFileSync, writeFileSync, moveSync } from 'fs-extra';
import Display from './display';
const csv = require('csv-parser')
const fs = require('fs')

export default class Jackbox {
    static Items: Array<JackboxQA> = new Array<JackboxQA>();

    static Initialize() {
        fs.createReadStream('./conf/Question.csv')
            .pipe(csv())
            .on('data', (data) => Jackbox.Items.push(new JackboxQA(data.Question,data.Answer)))
            .on('end', () => {
                Display.debug(`Jackbox TMP2 Questions: ${Jackbox.Items.length} loaded`);
            });
    }

    static Search(query : string) {
        return this.Items.find((o) => o.question.indexOf(query) > -1);
    }
}

export class JackboxQA {
    question: string;
    answer: string;

    constructor(question: string, answer: string)
    {
        this.question = question.toLowerCase();
        this.answer = answer.toLowerCase();
    }
}