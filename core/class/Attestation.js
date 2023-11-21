"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attestation = void 0;
const Schema_1 = require("./Schema");
const SchemaError_1 = require("./SchemaError");
const get_date_1 = require("../utils/get-date");
const GAP_1 = require("./GAP");
const consts_1 = require("../consts");
const GapContract_1 = require("./contract/GapContract");
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
        this.createdAt = (0, get_date_1.getDate)(args.createdAt || Date.now() / 1000);
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
            this.schema.setValue('json', JSON.stringify(values));
        this._data = values;
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
        return typeof data === 'string'
            ? Attestation.fromDecodedSchema(data)
            : data;
    }
    /**
     * Revokes this attestation.
     * @param eas
     * @param signer
     * @returns
     */
    revoke(signer) {
        try {
            return GapContract_1.GapContract.multiRevoke(signer, [
                {
                    data: [
                        {
                            uid: this.uid,
                            value: 0n,
                        },
                    ],
                    schema: this.schema.uid,
                },
            ]);
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.SchemaError('REVOKE_ERROR', 'Error revoking attestation.');
        }
    }
    /**
     * Attests the data using the specified signer and schema.
     * @param signer - The signer or provider to use for attestation.
     * @param args - Additional arguments to pass to the schema's `attest` method.
     * @returns A Promise that resolves to the UID of the attestation.
     * @throws An `AttestationError` if an error occurs during attestation.
     */
    async attest(signer, ...args) {
        console.log({ data: this.data });
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
            throw new SchemaError_1.AttestationError('ATTEST_ERROR', 'Error during attestation.');
        }
    }
    /**
     * Validates the payload.
     *
     * If an attestation should have anything
     * specifically explicit, it should be implemented in
     * order to avoid errors.
     * @returns
     */
    assertPayload() {
        return true;
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
     * @returns [Encoded payload, Raw payload]
     */
    async payloadFor(refIdx) {
        this.assertPayload();
        if (this.schema.isJsonSchema()) {
            const ipfsManager = GAP_1.GAP.ipfs;
            if (ipfsManager) {
                const ipfsHash = await ipfsManager.save(this._data);
                const encodedData = ipfsManager.encode(ipfsHash, 0);
                this.schema.setValue("json", JSON.stringify(encodedData));
            }
        }
        const payload = (encode = true) => ({
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
                        data: (encode ? this.schema.encode() : this.schema.schema),
                        recipient: this.recipient,
                    },
                ],
            },
        });
        return {
            payload: payload(),
            raw: payload(false),
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
            if (parsed.length === 1 && parsed[0].name === 'json') {
                const { value } = parsed[0];
                return (typeof value.value === 'string'
                    ? JSON.parse(value.value)
                    : value.value);
            }
            if (parsed && Array.isArray(parsed)) {
                return parsed.reduce((acc, curr) => {
                    const { value } = curr.value;
                    if (curr.type.includes('uint')) {
                        acc[curr.name] = ['string', 'bigint'].includes(typeof value)
                            ? BigInt(value)
                            : Number(value);
                    }
                    else
                        acc[curr.name] = value;
                    return acc;
                }, {});
            }
            throw new SchemaError_1.SchemaError('INVALID_DATA', 'Data must be a valid JSON array string.');
        }
        catch (error) {
            console.error(error);
            throw new SchemaError_1.SchemaError('INVALID_DATA', 'Data must be a valid JSON string.');
        }
    }
    /**
     * Transform attestation interface-based into class-based.
     */
    static fromInterface(attestations) {
        const result = [];
        attestations.forEach((attestation) => {
            try {
                const schema = Schema_1.Schema.get(attestation.schemaId);
                result.push(new Attestation({
                    ...attestation,
                    schema,
                    data: attestation.decodedDataJson,
                }));
            }
            catch (e) {
                console.log(e);
            }
        });
        return result;
    }
    /**
     * Asserts if schema is valid.
     * > Does not check refUID if `strict = false`. To check refUID use `Schema.validate()`
     * @param args
     */
    assert(args, strict = false) {
        const { schema, uid } = args;
        if (!schema || !(schema instanceof Schema_1.Schema)) {
            throw new SchemaError_1.SchemaError('MISSING_FIELD', 'Schema must be an array.');
        }
        if (!uid) {
            throw new SchemaError_1.SchemaError('MISSING_FIELD', 'Schema uid is required');
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
            uid: '0x0',
            createdAt: new Date(),
        });
    }
}
exports.Attestation = Attestation;
