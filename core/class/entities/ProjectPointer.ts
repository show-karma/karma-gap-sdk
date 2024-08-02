import { SignerOrProvider, TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";
import { AttestationError } from "../SchemaError";
import { AllGapSchemas } from "../AllGapSchemas";
import { chainIdToNetwork } from "../../../core/consts";

export interface _IProjectPointer extends ProjectPointer {}

export interface IProjectPointer {
  ogProjectUID: string;
  type?: string;
}

export class ProjectPointer
  extends Attestation<IProjectPointer>
  implements IProjectPointer
{
  ogProjectUID: string;

  static from(
    attestations: _IProjectPointer[],
    network: TNetwork
  ): ProjectPointer[] {
    return attestations.map((attestation) => {
      const projectUpdate = new ProjectPointer({
        ...attestation,
        data: {
          ...attestation.data,
        },
        schema: new AllGapSchemas().findSchema(
          "ProjectUpdate",
          chainIdToNetwork[attestation.chainID] as TNetwork
        ),
        chainID: attestation.chainID,
      });

      return projectUpdate;
    });
  }
}
