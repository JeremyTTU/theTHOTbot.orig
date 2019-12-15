import { readFileSync } from 'fs-extra';
import Display from './display';
var memoize = require("memoizee");

export default class WordSplitter {
    private CorpusMap: Map<string, number> = new Map<string, number>();
    private CorpusSize: number = 0;
    private CorpusMemoed = memoize(this.segment);

    constructor() {
        Display.debug("Loading WordSplitter JSON data");
        var test = JSON.parse(readFileSync('./conf/wordsplitter.json').toString());
        test.forEach(element => {
            this.CorpusMap.set(element.key, element.value);
            this.CorpusSize += parseInt(element.value);
        });

        Display.debug("Loading Complete.");
        Display.debug("Total Corpus Words - " + this.CorpusMap.size);
        Display.debug("Total Corpus Size  - " + this.CorpusSize);
    }

    parse(text: string) {
        var parsed = this.segment(text);
        return parsed == null ? '' : parsed.join(' ');
    }

    private segment(text) {
        if (text === undefined || text.length == 0) return new Array;
        var candidates = this.splits(text.toLowerCase()).map((v) => new Array(v[0]).concat(this.CorpusMemoed(v[1])));
        var m = this.max(candidates, (o) => this.probability(o));
        return m;
    }

    private max(candidates, fn) {
        var maxV = 0;
        var maxC = null;
        candidates.forEach(v => {
            var r = fn(v);
            if (r > maxV) {
                maxV = r;
                maxC = v;
            }
        });
        return maxC;
    }

    private splits(text, L = 20) {
        var results = new Array;
        for (var x = 0; x < Math.min(text.length, L); x++)
            results.push([text.substring(0, x + 1), text.substring(x + 1, text.length)]);
        return results;
    }

    private probability(words: string[]) {
        return this.product(words.map(word => this.get_word_probablity(word)));
    }

    private get_word_probablity(word: string) {
        if (this.CorpusMap.has(word)) {
            var wordValue = this.CorpusMap.get(word);
            if (wordValue != null)
                return wordValue / this.CorpusSize;
        }
        return 10.0 / (this.CorpusSize * Math.pow(10, word.length));
    }

    private product(nums) {
        return nums.reduce((a: number, b: number) => a * b, 1);
    }
}