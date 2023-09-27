import { Hex } from "../types";
export declare const gqlQueries: {
    attestation: (uid: Hex) => string;
    attestations: (schemaId: Hex, uid: Hex) => string;
    attestationsIn: (uids: Hex[], search?: string) => string;
    attestationsFrom: (schemaId: Hex, attester: Hex) => string;
    attestationsTo: (schemaId: Hex, recipient: Hex) => string;
    attestationPairs: (schemaId: Hex, attester: Hex, recipient: Hex) => string;
    attestationsOf: (schemaId: Hex, search?: string[] | string) => string;
    dependentsOf: (refs: Hex | Hex[], schemaIds: Hex[], attesters?: Hex[]) => string;
    schemata: (creator: Hex) => string;
};
