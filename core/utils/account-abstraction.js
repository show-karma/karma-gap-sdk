"use strict";
/**
 * Account abstraction utilities for ZeroDev integration
 *
 * This is a placeholder implementation that will be completed
 * once ZeroDev SDK is fully compatible with the latest versions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTRYPOINT_ADDRESS_V07 = exports.ENTRYPOINT_ADDRESS_V06 = void 0;
exports.createSmartAccount = createSmartAccount;
exports.sendSmartAccountTransaction = sendSmartAccountTransaction;
exports.getSmartAccountAddress = getSmartAccountAddress;
// Define entrypoint addresses
exports.ENTRYPOINT_ADDRESS_V06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
exports.ENTRYPOINT_ADDRESS_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
/**
 * Create a ZeroDev smart account from a signer
 *
 * @note This is a placeholder implementation
 */
async function createSmartAccount(options) {
    // Placeholder implementation
    console.warn("Account abstraction is currently under development");
    return {
        account: {
            address: options.signer.account?.address || "0x0",
        },
        client: null,
    };
}
/**
 * Send a transaction using the smart account
 *
 * @note This is a placeholder implementation
 */
async function sendSmartAccountTransaction(client, to, data, value) {
    console.warn("Smart account transactions are currently under development");
    return null;
}
/**
 * Get the smart account address
 */
function getSmartAccountAddress(account) {
    return account.address || "0x0";
}
