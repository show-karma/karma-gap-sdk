export function toUnix(value: number | Date | string) {
  switch (typeof value) {
    case "number":
      value = Math.round(value);
      if (value.toString().length > 13)
        throw new Error("Invalid timestamp length");
      if (value.toString().length === 10) return value;
      return Math.floor(value / 1000);
    case "string":
      if (/\D/.test(value)) return null;
      return toUnix(+value);
    case "object":
      if (value instanceof Date) return toUnix(value.getTime());
      return null;
    default:
      return null;
  }
}
