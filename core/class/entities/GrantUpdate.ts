import { SignerOrProvider } from 'core/types';
import { Attestation } from '../Attestation';
import { GapSchema } from '../GapSchema';
import { AttestationError } from '../SchemaError';

export interface IGrantUpdate {
  title: string;
  text: string;
  type?: string;
}

export interface IGrantUpdateVerified {
  type: 'verified';
  reason?: string;
}

export class GrantUpdateVerified
  extends Attestation<IGrantUpdateVerified>
  implements IGrantUpdateVerified
{
  type: 'verified';
  reason?: string;
}

export class GrantUpdate
  extends Attestation<IGrantUpdate>
  implements IGrantUpdate
{
  title: string;
  text: string;
  verified: GrantUpdateVerified[] = [];

  /**
   * Attest the status of the milestone as approved, rejected or completed.
   */
  private async attestStatus(signer: SignerOrProvider, schema: GapSchema) {
    const eas = this.schema.gap.eas.connect(signer);
    try {
      const tx = await eas.attest({
        schema: schema.uid,
        data: {
          recipient: this.recipient,
          data: schema.encode(),
          refUID: this.uid,
          expirationTime: 0n,
          revocable: schema.revocable,
        },
      });

      const uid = await tx.wait();
      console.log(uid);
    } catch (error: any) {
      console.error(error);
      throw new AttestationError('ATTEST_ERROR', error.message);
    }
  }

  /**
   * Verify this GrantUpdate. If the GrantUpdate is not already verified,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async verify(signer: SignerOrProvider, reason = '') {
    console.log('Verifying');

    const schema = this.schema.gap.findSchema('GrantUpdateVerified');
    schema.setValue('type', 'verified');
    schema.setValue('reason', reason);

    console.log('Before attest grant update verified');
    await this.attestStatus(signer, schema);
    console.log('After attest grant update verified');

    this.verified.push(
      new GrantUpdateVerified({
        data: {
          type: 'verified',
          reason,
        },
        refUID: this.uid,
        schema: schema,
        recipient: this.recipient,
      })
    );
  }
}
