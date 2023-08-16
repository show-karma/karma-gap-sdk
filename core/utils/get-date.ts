export function getDate(date: Date | number) {
  return typeof date === "number" ? new Date(date * 1000) : date;
}
