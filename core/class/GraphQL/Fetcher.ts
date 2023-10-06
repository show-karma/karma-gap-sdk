import { Hex, IAttestation, TSchemaName } from "core/types";
import { EASClient } from "./EASClient";
import { Attestation } from "../Attestation";
import { GapSchema } from "../GapSchema";

export abstract class Fetcher extends EASClient {
  /**
   * Fetch a single attestation by its UID.
   * @param uid
   */
  abstract attestation<T = unknown>(uid: Hex): Promise<Attestation<T>>;

  /**
   * Fetch attestations of a schema.
   * @param schemaName
   * @param search if set, will search decodedDataJson by the value.
   * @returns
   */
  abstract attestations(
    schemaName: TSchemaName,
    search?: string
  ): Promise<IAttestation[]>;

  /**
   * Fetch attestations of a schema.
   * @param schemaName
   * @param recipient
   * @returns
   */
  abstract attestationsOf(
    schemaName: TSchemaName,
    recipient: Hex
  ): Promise<IAttestation[]>;
}
