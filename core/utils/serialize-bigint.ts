export function serializeWithBigint(value: unknown) {
  return JSON.stringify(
    value,
    (this,
    (key, value) => (typeof value === "bigint" ? value.toString() : value))
  );
}
