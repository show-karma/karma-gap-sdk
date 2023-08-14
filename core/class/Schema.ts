import { SchemaItem } from "@ethereum-attestation-service/eas-sdk";
import { SchemaConfig, TSchemaName } from "../types";
import { SchemaError } from "./SchemaError";

export class Schema implements SchemaConfig {
  private static schemas: Schema[] = [];

  public readonly name: TSchemaName;
  public readonly schema: SchemaItem[];
  public readonly uid: string;
  public readonly references: TSchemaName;

  /**
   * Creates a new schema instance
   * @param args
   * @param strict If true, will throw an error if schema reference is not valid. With this option, user should add schemas
   * in a strict order.
   */
  constructor(args: SchemaConfig, strict = false) {
    this.assert(args, strict);
    Object.assign(this, args);
  }

  /**
   * Asserts if schema is valid.
   * > Does not check references if `strict = false`. To check references use `Schema.validate()`
   * @param args
   */
  private assert(args: SchemaConfig, strict = false) {
    const { name, schema, uid, references } = args;

    if (!name) {
      throw new SchemaError("MISSING_FIELD", "Schema name is required");
    }

    if (!schema && !Array.isArray(schema)) {
      throw new SchemaError("MISSING_FIELD", "Schema must be an array.");
    }

    if (!uid) {
      throw new SchemaError("MISSING_FIELD", "Schema uid is required");
    }

    if (strict && references && !Schema.exists(references)) {
      throw new SchemaError(
        "INVALID_REFERENCE",
        `Schema ${name} references ${references} but it does not exist.`
      );
    }
  }

  static exists(name: string) {
    return this.schemas.find((schema) => schema.name === name);
  }

  static add(...schemas: SchemaConfig[]) {
    schemas.forEach((schema) => {
      const instance = new Schema(schema);
      if (!this.get(schema.name)) this.schemas.push(instance);
      else
        throw new SchemaError(
          "SCHEMA_ALREADY_EXISTS",
          `Schema ${schema.name} already exists.`
        );
    });
  }

  static get(name: string) {
    const schema = this.schemas.find((schema) => schema.name === name);

    if (!schema)
      throw new SchemaError(
        "SCHEMA_NOT_FOUND",
        `Schema ${name} not found. Available schemas: ${Schema.getNames()}`
      );

    return schema;
  }

  static getNames(): string[] {
    return Schema.schemas.map((schema) => schema.name);
  }

  /**
   * Validade references
   * @throws {SchemaError} if any reference is not valid
   * @returns {true} if references are valid
   */
  static validate(): true {
    const errors: SchemaError[] = [];

    this.schemas.forEach((schema) => {
      if (!schema.references || Schema.exists(schema.references)) return;
      else
        errors.push(
          new SchemaError(
            "INVALID_REFERENCE",
            `Schema ${schema.name} references ${schema.references} but it does not exist.`
          )
        );
    });

    if (errors) throw errors;
    return true;
  }
}
