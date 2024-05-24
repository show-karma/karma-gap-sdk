"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchGelatoTxn = void 0;
const relay_sdk_1 = require("@gelatonetwork/relay-sdk");
var TaskState;
(function (TaskState) {
    TaskState["CheckPending"] = "CheckPending";
    TaskState["ExecPending"] = "ExecPending";
    TaskState["ExecSuccess"] = "ExecSuccess";
    TaskState["ExecReverted"] = "ExecReverted";
    TaskState["WaitingForConfirmation"] = "WaitingForConfirmation";
    TaskState["Blacklisted"] = "Blacklisted";
    TaskState["Cancelled"] = "Cancelled";
    TaskState["NotFound"] = "NotFound";
})(TaskState || (TaskState = {}));
/**
 * Waits for a transaction to be mined at Gelato Network
 * @param taskId
 * @returns
 */
async function watchGelatoTxn(taskId, ttl = 500) {
    const client = new relay_sdk_1.GelatoRelay();
    return new Promise((resolve, reject) => {
        const loop = async () => {
            const oneSecond = 1;
            try {
                while (oneSecond) {
                    const status = await client.getTaskStatus(taskId);
                    // print status :D so we can debug this for now
                    // eslint-disable-next-line no-console
                    console.log(status);
                    if (!status) {
                        reject(new Error('Transaction goes wrong.'));
                        break;
                    }
                    if (status && status.taskState === TaskState.ExecSuccess) {
                        resolve(status.transactionHash || '');
                        break;
                    }
                    else if ([
                        TaskState.Cancelled,
                        TaskState.ExecReverted,
                        TaskState.Blacklisted,
                    ].includes(status?.taskState)) {
                        reject(new Error(status.lastCheckMessage
                            ?.split(/(RegisterDelegate)|(Execution error): /)
                            .at(-1) || ''));
                        break;
                    }
                    await new Promise((r) => setTimeout(r, ttl));
                }
            }
            catch {
                // gelato may throw 429 error, so we need to retry
                // Increase ttl to avoid too deadlocking
                // Max ttl is 30s
                ttl += Math.max(30000, ttl + 1000);
            }
        };
        loop();
    });
}
exports.watchGelatoTxn = watchGelatoTxn;
