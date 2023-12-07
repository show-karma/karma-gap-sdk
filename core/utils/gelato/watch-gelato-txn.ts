import { GelatoRelay } from '@gelatonetwork/relay-sdk';

enum TaskState {
  CheckPending = 'CheckPending',
  ExecPending = 'ExecPending',
  ExecSuccess = 'ExecSuccess',
  ExecReverted = 'ExecReverted',
  WaitingForConfirmation = 'WaitingForConfirmation',
  Blacklisted = 'Blacklisted',
  Cancelled = 'Cancelled',
  NotFound = 'NotFound',
}

/**
 * Waits for a transaction to be mined at Gelato Network
 * @param taskId
 * @returns
 */
async function watchGelatoTxn(taskId: string, ttl = 500): Promise<string> {
  const client = new GelatoRelay();
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
          } else if (
            [
              TaskState.Cancelled,
              TaskState.ExecReverted,
              TaskState.Blacklisted,
            ].includes(status?.taskState)
          ) {
            reject(
              new Error(
                status.lastCheckMessage
                  ?.split(/(RegisterDelegate)|(Execution error): /)
                  .at(-1) || ''
              )
            );
            break;
          }

          await new Promise((r) => setTimeout(r, ttl));
        }
      } catch {
        // gelato may throw 429 error, so we need to retry
        // Increase ttl to avoid too deadlocking
        // Max ttl is 30s
        ttl += Math.max(30000, ttl + 1000);
      }
    };
    loop();
  });
}

export { watchGelatoTxn };
