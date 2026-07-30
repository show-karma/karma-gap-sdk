import { chainIdToNetwork } from "../consts";
import { UnsupportedChainError } from "../class/SchemaError";
import { TNetwork } from "../types";

/**
 * Resolves the network name for a chain id, falling back to a known-good
 * network when the chain id is missing, null or not part of the supported map.
 *
 * Entity mappers use this so a single attestation carrying an unmapped chain id
 * degrades to the caller's network instead of producing an `undefined` network
 * that later blows up inside the schema registry.
 */
export function networkOfChain(
  chainId: number | undefined | null,
  fallback: TNetwork
): TNetwork {
  const network = chainId == null ? undefined : chainIdToNetwork[chainId];
  return (network as TNetwork) ?? fallback;
}

/**
 * Resolves the network name for a chain id the caller explicitly targeted.
 *
 * Unlike {@link networkOfChain} there is no sensible fallback here: silently
 * using another network would sign the attestation against the wrong schema
 * UIDs, so an unsupported chain id is a hard error.
 */
export function requireNetworkOfChain(
  chainId: number | undefined | null,
  context: string
): TNetwork {
  const network = chainId == null ? undefined : chainIdToNetwork[chainId];

  if (!network) {
    throw new UnsupportedChainError(
      `${context}: chain id ${String(
        chainId
      )} is not supported. Supported chain ids: ${Object.keys(
        chainIdToNetwork
      ).join(", ")}`
    );
  }

  return network as TNetwork;
}
