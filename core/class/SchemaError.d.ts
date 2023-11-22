declare const SchemaErrorCodes: {
    INVALID_SCHEMA: number;
    INVALID_SCHEMA_NAME: number;
    INVALID_SCHEMA_TYPE: number;
    SCHEMA_ALREADY_EXISTS: number;
    SCHEMA_NOT_FOUND: number;
    SCHEMA_NOT_CREATED: number;
    MISSING_FIELD: number;
    INVALID_REFERENCE: number;
    INVALID_SCHEMA_FIELD: number;
    INVALID_DATA: number;
    REVOKE_ERROR: number;
    ATTEST_ERROR: number;
    INVALID_REF_UID: number;
    REVOKATION_ERROR: number;
    NOT_REVOCABLE: number;
    IPFS_UPLOAD: number;
};
export declare class SchemaError extends Error {
    readonly code: number;
    private readonly _message;
    constructor(code: keyof typeof SchemaErrorCodes, append?: string);
    get message(): string;
}
export declare class AttestationError extends SchemaError {
}
export {};
