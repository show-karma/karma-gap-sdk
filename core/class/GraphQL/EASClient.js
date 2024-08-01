"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EASClient = void 0;
const consts_1 = require("../../consts");
const AxiosGQL_1 = require("./AxiosGQL");
class EASClient extends AxiosGQL_1.AxiosGQL {
    constructor(args) {
        const { network } = args;
        super(consts_1.Networks[network].url);
        this.assert(args);
        this._network = { ...consts_1.Networks[network], name: network };
    }
    /**
     * Validate the constructor arguments
     * @param args
     */
    assert(args) {
        if (!consts_1.Networks[args.network]) {
            throw new Error("Invalid network");
        }
    }
    get network() {
        return this._network.name;
    }
}
exports.EASClient = EASClient;
