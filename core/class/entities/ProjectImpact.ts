import { SignerOrProvider, TNetwork } from '../../types';
import { Attestation, AttestationArgs } from '../Attestation';
import { GapSchema } from '../GapSchema';
import { AttestationError } from '../SchemaError';
import { AllGapSchemas } from '../AllGapSchemas';
import { chainIdToNetwork } from '../../consts';


export interface _IProjectImpact extends ProjectImpact {}

type IStatus = 'verified';

export interface IProjectImpactStatus {
  type: `project-impact-${IStatus}`;
  reason?: string;
}

export class ProjectImpactStatus
  extends Attestation<IProjectImpactStatus>
  implements IProjectImpactStatus
{
  type: `project-impact-${IStatus}`;
  reason?: string;
}

export interface IProjectImpact {
  work: string;
  impact: string;
  proof: string;
  completedAt: number;
  type?: string;
}

export class ProjectImpact
  extends Attestation<IProjectImpact>
  implements IProjectImpact
{
  work: string;
  impact: string;
  proof: string;
  completedAt: number;
  type?: string;
  verified: ProjectImpactStatus[] = [];

  constructor(data: AttestationArgs<IProjectImpact, GapSchema>) {
    (data.data as any).type = "project-impact";
    super(data);
  }

  /**
   * Attest Project Impact.
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
   * Verify this ProjectImpact. If the ProjectImpact is not already verified,
   * it will throw an error.
   * @param signer
   * @param reason
   */
  async verify(signer: SignerOrProvider, reason = '') {
    console.log('Verifying ProjectImpact');

    const schema = this.schema.gap.findSchema('GrantUpdateStatus');
    schema.setValue('type', 'project-impact-verified');
    schema.setValue('reason', reason);

    console.log('Before attest project impact verified');
    await this.attestStatus(signer, schema);
    console.log('After attest project impact verified');

    this.verified.push(
      new ProjectImpactStatus({
        data: {
          type: 'project-impact-verified',
          reason,
        },
        refUID: this.uid,
        schema: schema,
        recipient: this.recipient,
      })
    );
  }

  static from(attestations: _IProjectImpact[], network: TNetwork): ProjectImpact[] {
    return attestations.map((attestation) => {
      const grantUpdate =  new ProjectImpact({
            ...attestation,
            data: {
              ...attestation.data,
            },
            schema: new AllGapSchemas().findSchema('ProjectImpact', chainIdToNetwork[attestation.chainID] as TNetwork),
            chainID: attestation.chainID,
      });

      if (attestation.verified?.length > 0) {
        grantUpdate.verified = attestation.verified.map(m => new ProjectImpactStatus({
          ...m,
          data: {
            ...m.data,
          },
          schema: new AllGapSchemas().findSchema('GrantUpdateStatus', chainIdToNetwork[attestation.chainID] as TNetwork),
          chainID: attestation.chainID,
        })
        );
      }

      return grantUpdate;
    });
  }
}
