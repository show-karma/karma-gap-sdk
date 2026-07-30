/**
 * Errors raised by `GapIndexerClient` when a request cannot be made or when the
 * indexer answers with a body that is not the entity the caller asked for.
 *
 * They are deliberately distinct from transport errors (axios) so callers can
 * tell "the indexer is unreachable" apart from "the indexer answered 200 with
 * something unusable".
 */
export class GapIndexerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * Thrown before any HTTP call when a uid/slug argument is empty or blank.
 *
 * A blank identifier collapses `/projects/${slug}` into the collection route,
 * which answers 200 with a bare array and used to crash the entity mappers.
 */
export class InvalidIdentifierError extends GapIndexerError {
  constructor(resource: string, identifierName: string) {
    super(
      `${resource}: a non-empty ${identifierName} is required, received an empty value`
    );
  }
}

/**
 * Thrown when the indexer answers 200 with a body that is not shaped like the
 * requested attestation (empty string, array, error object, HTML, ...).
 */
export class MalformedResponseError extends GapIndexerError {
  readonly identifier: string;
  readonly received: string;

  constructor(resource: string, identifier: string, received: unknown) {
    const receivedDescription = describeReceived(received);

    super(
      `${resource} not found or malformed response for "${identifier}" (received ${receivedDescription})`
    );

    this.identifier = identifier;
    this.received = receivedDescription;
  }
}

function describeReceived(received: unknown): string {
  if (received === null) return "null";
  if (Array.isArray(received)) return `array(${received.length})`;
  if (typeof received === "string") {
    return received.length === 0 ? "empty string" : "string";
  }
  if (typeof received === "object") return "object without a numeric chainID";
  return typeof received;
}
