"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attestation = void 0;
const Schema_1 = require("./Schema");
const SchemaError_1 = require("./SchemaError");
const get_date_1 = require("../utils/get-date");
const GAP_1 = require("./GAP");
const consts_1 = require("../consts");
/**
 * Represents the EAS Attestation and provides methods to manage attestations.
 * @example
 *
 * ```ts
 * const grantee = new Attestation({
 *  schema: Schema.get("Grantee"), // Use GapSchema.find("SchemaName") if using default GAP schemas
 *  data: { grantee: true },
 *  uid: "0xabc123",
 * });
 *
 * const granteeDetails = new Attestation({
 *  schema: Schema.get("GranteeDetails"),
 *  data: {
 *    name: "John Doe",
 *    description: "A description",
 *    imageURL: "https://example.com/image.png",
 *  },
 *  uid: "0xab234"
 * );
 *
 * // Return the refferenced attestation
 * const ref = granteeDetails.reference<Grantee>();
 *
 * // Revoke attestation
 * granteeDetails.revoke();
 *
 * // Get attestation data from a decoded JSON string.
 * granteeDetails.fromDecodedSchema(granteeDetails.data);
 * ```
 */
class Attestation {
    constructor(args) {
        this.schema = args.schema;
        this._data = this.fromDecodedSchema(args.data);
        this.setValues(this._data);
        this._uid = args.uid || consts_1.nullRef;
        this.refUID = args.refUID || consts_1.nullRef;
        this.attester = args.attester;
        this.recipient = args.recipient;
        this.revoked = args.revoked;
        this.revocationTime = (0, get_date_1.getDate)(args.revocationTime);
        this.createdAt = (0, get_date_1.getDate)(args.createdAt || Date.now());
    }
    /**
     * Encodes the schema.
     * @returns
     */
    encodeSchema(schema) {
        return this.schema.encode(schema);
    }
    /**
     * Sets a field in the schema.
     */
    setValue(key, value) {
        this.schema.setValue(key, value);
    }
    /**
     * Set attestation values to be uploaded.
     * @param values
     */
    setValues(values) {
        const isJsonSchema = this.schema.isJsonSchema();
        if (isJsonSchema)
            this.schema.setValue("json", JSON.stringify(values));
        Object.entries(values).forEach(([key, value]) => {
            this[key] = value;
            if (!isJsonSchema)
                this.setValue(key, value.value || value);
        });
    }
    /**
     * Returns the referenced attestation
     */
    reference() {
        return this._reference;
    }
    /**
     * Returns the attestation data as a JSON string.
     * @param data
     * @returns
     */
    fromDecodedSchema(data) {
        return typeof data === "string"
            ? Attestation.fromDecodedSchema(data)
            : data;
    }
    /**
     * Revokes this attestation.
     * @param eas
     * @param signer
     * @returns
     */
    async revoke(signer) {
        try {
            const eas = GAP_1.GAP.eas.connect(signer);
            const tx = await eas.revoke({
                data: {
                    uid: this.uid,
                },
                schema: this.schema.uid,
            });
            return tx.wait();
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.SchemaError("REVOKE_ERROR", "Error revoking attestation.");
        }
    }
    /**
     * Attests this attestation and revokes the previous one.
     * @param signer
     * @param args overridable params
     */
    async attest(signer, ...args) {
        console.log(`Attesting ${this.schema.name}`);
        if (this.uid && this.uid !== consts_1.nullRef)
            await this.revoke(signer);
        try {
            const uid = await this.schema.attest({
                data: this.data,
                to: this.recipient,
                refUID: this.refUID,
                signer,
            });
            this._uid = uid;
            console.log(`Attested ${this.schema.name} with UID ${uid}`);
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.AttestationError("ATTEST_ERROR", "Error during attestation.");
        }
    }
    /**
     * Get the multi attestation payload for the referred index.
     *
     * The index should be the array position this payload wants
     * to reference.
     *
     * E.g:
     *
     * 1. Project is index 0;
     * 2. Project details is index 1;
     * 3. Grant is index 2;
     * 4. Grant details is index 3;
     * 5. Milestone is index 4;
     *
     * `[Project, projectDetails, grant, grantDetails, milestone]`
     *
     * -> Project.payloadFor(0); // refs itself (no effect)
     *
     * -> project.details.payloadFor(0); // ref project
     *
     * -> grant.payloadFor(0); // ref project
     *
     * -> grant.details.payloadFor(2); // ref grant
     *
     * -> milestone.payloadFor(2); // ref grant
     *
     *
     * @param refIdx
     * @returns
     */
    payloadFor(refIdx) {
        return {
            uid: consts_1.nullRef,
            refIdx,
            multiRequest: {
                schema: this.schema.uid,
                data: [
                    {
                        refUID: this.refUID,
                        expirationTime: 0n,
                        revocable: this.schema.revocable || true,
                        value: 0n,
                        data: this.schema.encode(),
                        recipient: this.recipient,
                    },
                ],
            },
        };
    }
    /**
     * Returns an Attestation instance from a JSON decoded schema.
     * @param data
     * @returns
     */
    static fromDecodedSchema(data) {
        try {
            const parsed = JSON.parse(data);
            if (data.length < 2 && !/\{.*\}/gim.test(data))
                return {};
            if (parsed.length === 1 && parsed[0].name === "json") {
                const { value } = parsed[0];
                return (typeof value.value === "string"
                    ? JSON.parse(value.value)
                    : value.value);
            }
            if (parsed && Array.isArray(parsed)) {
                return parsed.reduce((acc, curr) => {
                    const { value } = curr.value;
                    if (curr.type.includes("uint")) {
                        acc[curr.name] = ["string", "bigint"].includes(typeof value)
                            ? BigInt(value)
                            : Number(value);
                    }
                    else
                        acc[curr.name] = value;
                    return acc;
                }, {});
            }
            throw new SchemaError_1.SchemaError("INVALID_DATA", "Data must be a valid JSON array string.");
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.SchemaError("INVALID_DATA", "Data must be a valid JSON string.");
        }
    }
    /**
     * Transform attestation interface-based into class-based.
     */
    static fromInterface(attestations) {
        return attestations.map((attestation) => {
            const schema = Schema_1.Schema.get(attestation.schemaId);
            return new Attestation({
                ...attestation,
                schema,
                data: attestation.decodedDataJson,
            });
        });
    }
    /**
     * Asserts if schema is valid.
     * > Does not check refUID if `strict = false`. To check refUID use `Schema.validate()`
     * @param args
     */
    assert(args, strict = false) {
        const { schema, uid } = args;
        if (!schema || !(schema instanceof Schema_1.Schema)) {
            throw new SchemaError_1.SchemaError("MISSING_FIELD", "Schema must be an array.");
        }
        if (!uid) {
            throw new SchemaError_1.SchemaError("MISSING_FIELD", "Schema uid is required");
        }
        if (strict)
            Schema_1.Schema.validate();
    }
    get data() {
        return this._data;
    }
    get uid() {
        return this._uid;
    }
    set uid(uid) {
        this._uid = uid;
    }
    /**
     * Create attestation to serve as Attestation data.
     * @param data Data to attest
     * @param schema selected schema
     * @param from attester
     * @param to recipient
     * @returns
     */
    static factory(data, schema, from, to) {
        return new Attestation({
            data: data,
            recipient: to,
            attester: from,
            schema,
            uid: "0x0",
            createdAt: new Date(),
        });
    }
}
exports.Attestation = Attestation;
