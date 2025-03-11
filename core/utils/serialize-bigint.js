"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeWithBigint = void 0;
function serializeWithBigint(value) {
    return JSON.stringify(value, (this,
        (key, value) => (typeof value === "bigint" ? value.toString() : value)));
}
exports.serializeWithBigint = serializeWithBigint;
