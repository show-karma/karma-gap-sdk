"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetcher = void 0;
const AxiosGQL_1 = require("./GraphQL/AxiosGQL");
class Fetcher extends AxiosGQL_1.AxiosGQL {
    constructor(url) {
        super(url);
    }
    set gapInstance(gap) {
        this.gap = gap;
    }
}
exports.Fetcher = Fetcher;
