import { InvalidIdentifierError, MalformedResponseError } from "./GapIndexerError";

/**
 * Minimal shape every attestation-backed indexer response must satisfy before
 * it is handed to an entity mapper.
 */
interface AttestationShaped {
  chainID: number;
}

function isAttestationShaped(body: unknown): body is AttestationShaped {
  return (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    typeof (body as AttestationShaped).chainID === "number"
  );
}

/**
 * Guards a uid/slug argument before it is interpolated into a request path.
 *
 * A blank identifier turns `/projects/${slug}` into the collection route, which
 * answers 200 with a bare array — the caller would then get a `MalformedResponseError`
 * for a request that never should have left the process.
 *
 * @throws {InvalidIdentifierError} when the identifier is empty or whitespace only.
 */
export function assertIdentifier(
  resource: string,
  identifierName: string,
  value: string | undefined | null
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidIdentifierError(resource, identifierName);
  }

  return value;
}

/**
 * Guards a single-entity response body before mapping it.
 *
 * @throws {MalformedResponseError} when the body is not a single attestation-shaped object.
 */
export function assertAttestationBody<T>(
  resource: string,
  identifier: string,
  body: unknown
): T {
  if (!isAttestationShaped(body)) {
    throw new MalformedResponseError(resource, identifier, body);
  }

  return body as T;
}

/**
 * Guards a list response body before mapping it.
 *
 * @throws {MalformedResponseError} when the body is not an array of attestation-shaped objects.
 */
export function assertAttestationList<T>(
  resource: string,
  identifier: string,
  body: unknown
): T[] {
  if (!Array.isArray(body)) {
    throw new MalformedResponseError(resource, identifier, body);
  }

  body.forEach((item, index) => {
    if (!isAttestationShaped(item)) {
      throw new MalformedResponseError(
        `${resource}[${index}]`,
        identifier,
        item
      );
    }
  });

  return body as T[];
}
