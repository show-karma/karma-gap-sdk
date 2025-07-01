"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDate = getDate;
function getDate(date) {
    return typeof date === "number" ? new Date(date * 1000) : date;
}
