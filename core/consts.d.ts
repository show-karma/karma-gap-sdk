import { EASNetworkConfig, SchemaInterface, TNetwork, TSchemaName } from "./types";
export declare const nullRef = "0x0000000000000000000000000000000000000000000000000000000000000000";
export declare const nullResolver = "0x0000000000000000000000000000000000000000";
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
