import { Hex } from "../types";
export declare const gqlQueries: {
    attestation: (uid: Hex) => string;
    attestationsFrom: (schemaId: Hex, attester: Hex) => string;
    attestationsTo: (schemaId: Hex, recipient: Hex) => string;
    attestationPairs: (schemaId: Hex, attester: Hex, recipient: Hex) => string;
    attestationsOf: (schemaId: Hex, search?: string) => string;
    dependentsOf: (refs: Hex | Hex[], schemaIds: Hex[], attesters?: Hex[]) => string;
    schemata: (creator: Hex) => string;
};
