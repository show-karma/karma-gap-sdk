"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeWithBigint = serializeWithBigint;
function serializeWithBigint(value) {
    return JSON.stringify(value, (this,
        (key, value) => (typeof value === "bigint" ? value.toString() : value)));
}
