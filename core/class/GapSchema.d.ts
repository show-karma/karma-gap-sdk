import { IGapSchema, SchemaInterface, TSchemaName } from "../types";
import { Schema } from "./Schema";
/**
 * Represents the GapSchema
 * @extends Schema
 */
export declare class GapSchema extends Schema implements IGapSchema {
    readonly name: TSchemaName;
    readonly references: TSchemaName;
    constructor(args: SchemaInterface<TSchemaName>, strict?: boolean, ignoreSchema?: boolean);
    /**
     * Clones a schema without references to the original.
     * @param schema
     * @returns
     */
    static clone(schema: GapSchema): GapSchema;
    /**
     * Returns a copy of the original schema with no pointers.
     * @param name
     * @returns
     */
    static find(name: TSchemaName): GapSchema;
    /**
     * Find many schemas by name and return their copies as an array in the same order.
     * @param names
     * @returns
     */
    static findMany(names: TSchemaName[]): GapSchema[];
    /**
     * Get all schemas that references this schema.
     */
    get children(): GapSchema[];
}
