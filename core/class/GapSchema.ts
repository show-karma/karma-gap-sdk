import { mapFilter } from "../utils";
import { IGapSchema, SchemaInterface, TSchemaName } from "../types";
import { Schema } from "./Schema";

/**
 * Represents the GapSchema
 * @extends Schema
 */
export class GapSchema extends Schema implements IGapSchema {
  public readonly name: TSchemaName;
  public readonly references: TSchemaName;

  constructor(
    args: SchemaInterface<TSchemaName>,
    strict = false,
    ignoreSchema = false
  ) {
    super(args, strict, ignoreSchema);

    if (!ignoreSchema)
      Schema.add(
        new GapSchema(
          {
            name: args.name,
            schema: args.schema.map((s) => ({ ...s })),
            uid: args.uid,
            references: args.references,
            revocable: args.revocable,
          },
          strict,
          true
        )
      );
  }

  /**
   * Clones a schema without references to the original.
   * @param schema
   * @returns
   */
  static clone(schema: GapSchema) {
    return new GapSchema(
      {
        name: schema.name,
        schema: schema.schema.map((s) => ({ ...s })),
        uid: schema.uid,
        references: schema.references,
        revocable: schema.revocable,
      },
      false,
      true
    );
  }

  /**
   * Returns a copy of the original schema with no pointers.
   * @param name
   * @returns
   */
  static find(name: TSchemaName): GapSchema {
    const found = Schema.get<TSchemaName, GapSchema>(name);
    return this.clone(found);
  }

  /**
   * Find many schemas by name and return their copies as an array in the same order.
   * @param names
   * @returns
   */
  static findMany(names: TSchemaName[]): GapSchema[] {
    const schemas = Schema.getMany<TSchemaName, GapSchema>(names);
    return schemas.map((s) => this.clone(s));
  }

  /**
   * Get all schemas that references this schema.
   */
  get children() {
    return mapFilter(
      GapSchema.schemas,
      (s) => s.references === this.name || s.references === this.uid,
      (s: Schema<TSchemaName>) => new GapSchema(s)
    );
  }
}
