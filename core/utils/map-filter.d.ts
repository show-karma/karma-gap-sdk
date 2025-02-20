/**
 * Filters an array by its condition then maps it to the desired format.
 * @param arr
 * @param condition
 * @param mapTo
 * @returns
 */
export declare function mapFilter<T = unknown, U = unknown>(arr: U[], condition: (item: U) => boolean, mapTo: (item: U) => T): T[];
