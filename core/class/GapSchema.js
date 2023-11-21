"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapSchema = void 0;
const utils_1 = require("../utils");
const Schema_1 = require("./Schema");
/**
 * Represents the GapSchema
 * @extends Schema
 */
class GapSchema extends Schema_1.Schema {
    constructor(args, strict = false, ignoreSchema = false) {
        super(args, strict, ignoreSchema);
        if (!ignoreSchema)
            Schema_1.Schema.add(new GapSchema({
                name: args.name,
                schema: args.schema.map((s) => ({ ...s })),
                uid: args.uid,
                references: args.references,
                revocable: args.revocable,
            }, strict, true));
    }
    /**
     * Clones a schema without references to the original.
     * @param schema
     * @returns
     */
    static clone(schema) {
        return new GapSchema({
            name: schema.name,
            schema: schema.schema.map((s) => ({ ...s })),
            uid: schema.uid,
            references: schema.references,
            revocable: schema.revocable,
        }, false, true);
    }
    /**
     * Returns a copy of the original schema with no pointers.
     * @param name
     * @returns
     */
    static find(name) {
        const found = Schema_1.Schema.get(name);
        return this.clone(found);
    }
    /**
     * Find many schemas by name and return their copies as an array in the same order.
     * @param names
     * @returns
     */
    static findMany(names) {
        const schemas = Schema_1.Schema.getMany(names);
        return schemas.map((s) => this.clone(s));
    }
    /**
     * Get all schemas that references this schema.
     */
    get children() {
        return (0, utils_1.mapFilter)(GapSchema.schemas, (s) => s.references === this.name || s.references === this.uid, (s) => new GapSchema(s, false, true));
    }
}
exports.GapSchema = GapSchema;
