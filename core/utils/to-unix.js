"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUnix = void 0;
function toUnix(value) {
    switch (typeof value) {
        case "number":
            if (value.toString().length > 13)
                throw new Error("Invalid timestamp length");
            if (value.toString().length === 10)
                return value;
            return Math.floor(value / 1000);
        case "string":
            if (/\D/.test(value))
                return null;
            return toUnix(+value);
        case "object":
            if (value instanceof Date)
                return toUnix(value.getTime());
            return null;
        default:
            return null;
    }
}
exports.toUnix = toUnix;
