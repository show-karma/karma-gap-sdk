import { EASNetworkConfig, SchemaInterface, TNetwork, TSchemaName } from "./types";
/**
 * Schemas that should use default EAS attestation
 * instead of the custom contract.
 */
export declare const useDefaultAttestation: TSchemaName[];
export declare const chainIdToNetwork: {
    11155420: string;
    42161: string;
    10: string;
    11155111: string;
    84532: string;
    42220: string;
    1328: string;
    1329: string;
};
export declare const nullRef = "0x0000000000000000000000000000000000000000000000000000000000000000";
export declare const nullResolver = "0x0000000000000000000000000000000000000000";
export declare const zeroAddress = "0x0000000000000000000000000000000000000000";
/**
 * The networks that are supported by the EAS
 */
export declare const Networks: Record<TNetwork, EASNetworkConfig>;
/**
 * Mounts the schemas for the given network and return all the settings
 * @param network
 * @returns
 */
export declare const MountEntities: (network: EASNetworkConfig) => Record<TSchemaName, SchemaInterface<TSchemaName>>;
export declare const alloSupportedNetworks: {
    mainnet: number[];
    testnet: number[];
};
export declare const AlloContracts: {
    registry: string;
    alloProxy: string;
    alloImplementation: string;
    strategy: {
        DonationVotingMerkleDistributionDirectTransferStrategy: string;
        DirectGrantsSimpleStrategy: string;
        RFPSimpleStrategy: string;
        RFPCommitteeStrategy: string;
        QVSimple: string;
    };
    factory: string;
};
