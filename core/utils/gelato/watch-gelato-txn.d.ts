/**
 * Waits for a transaction to be mined at Gelato Network
 * @param taskId
 * @returns
 */
declare function watchGelatoTxn(taskId: string, ttl?: number): Promise<string>;
export { watchGelatoTxn };
