const SchemaErrorCodes = {
  INVALID_SCHEMA: 50001,
  INVALID_SCHEMA_NAME: 50002,
  INVALID_SCHEMA_TYPE: 50003,
  SCHEMA_ALREADY_EXISTS: 50004,
  SCHEMA_NOT_FOUND: 50005,
  SCHEMA_NOT_CREATED: 50006,
  MISSING_FIELD: 50007,
  INVALID_REFERENCE: 50008,
  INVALID_SCHEMA_FIELD: 50009,
  INVALID_DATA: 50010,
  REVOKE_ERROR: 50011,
  ATTEST_ERROR: 50012,
};

export class SchemaError extends Error {
  readonly code: number;
  private readonly _message: string;

  constructor(code: keyof typeof SchemaErrorCodes, append?: string) {
    super(`${code}${append ? `: ${append}` : ""}`);
    this._message = append || code.replace(/_/g, " ");
    this.code = SchemaErrorCodes[code];
  }

  get message(): string {
    return this._message;
  }
}
