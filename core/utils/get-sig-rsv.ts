/**
 * Returns the r, s, v values of a signature
 * @param signature
 * @returns
 */
export function getSigRSV(signature: string) {
  const r = signature.slice(0, 66);
  const s = `0x${signature.slice(66, 130)}`;
  const v = `0x${signature.slice(130, 132)}`;
  return { r, s, v };
}
