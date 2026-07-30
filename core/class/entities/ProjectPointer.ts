import { TNetwork } from "../../../core/types";
import { Attestation } from "../Attestation";
import { AllGapSchemas } from "../AllGapSchemas";
import { networkOfChain } from "../../utils/network-of-chain";

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
          networkOfChain(attestation.chainID, network)
        ),
        chainID: attestation.chainID,
      });

      return projectUpdate;
    });
  }
}
