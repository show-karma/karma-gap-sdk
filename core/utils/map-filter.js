"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapFilter = void 0;
/**
 * Filters an array by its condition then maps it to the desired format.
 * @param arr
 * @param condition
 * @param mapTo
 * @returns
 */
function mapFilter(arr, condition, mapTo) {
    const newArray = [];
    for (const item of arr) {
        if (condition(item)) {
            newArray.push(mapTo(item));
        }
    }
    return newArray;
}
exports.mapFilter = mapFilter;
