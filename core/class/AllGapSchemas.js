"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllGapSchemas = void 0;
const consts_1 = require("../../core/consts");
const GapSchema_1 = require("./GapSchema");
const GAP_1 = require("./GAP");
class AllGapSchemas {
    constructor() {
        this.allSchemas = {};
        Object.keys(consts_1.Networks).forEach((network) => {
            this.allSchemas[network] = Object.values((0, consts_1.MountEntities)(consts_1.Networks[network]));
        });
    }
    findSchema(name, network) {
        const schema = this.allSchemas[network].find(s => s.name === name);
        return new GapSchema_1.GapSchema(schema, new GAP_1.GAP({ network: network }), false, false);
    }
}
exports.AllGapSchemas = AllGapSchemas;
