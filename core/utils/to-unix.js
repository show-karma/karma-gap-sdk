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
                throw new Error(`Invalid timestamp or date format "${value}".`);
            return toUnix(+value);
        case "object":
            if (value instanceof Date)
                return toUnix(value.getTime());
            throw new Error(`Invalid timestamp or date format "${value}".`);
        default:
            throw new Error(`Invalid timestamp or date format "${value}".`);
    }
}
exports.toUnix = toUnix;
