"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosGQL = void 0;
const axios_1 = __importDefault(require("axios"));
class AxiosGQL {
    constructor(url) {
        this.client = axios_1.default.create({
            baseURL: url,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
    async query(query, variables) {
        const { data: { data }, } = await this.client.post("", {
            query,
            variables,
        });
        return data;
    }
}
exports.AxiosGQL = AxiosGQL;
