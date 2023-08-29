/**
 * Filters an array by its condition then maps it to the desired format.
 * @param arr
 * @param condition
 * @param mapTo
 * @returns
 */
export function mapFilter<T = unknown, U = unknown>(
  arr: U[],
  condition: (item: U) => boolean,
  mapTo: (item: U) => T
): T[] {
  const newArray: T[] = [];

  for (const item of arr) {
    if (condition(item)) {
      newArray.push(mapTo(item));
    }
  }
  return newArray;
}
