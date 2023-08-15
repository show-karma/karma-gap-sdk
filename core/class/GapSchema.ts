import { IGapSchema, TSchemaName } from "../types";
import { Schema } from "./Schema";

export class GapSchema extends Schema implements IGapSchema {
  public readonly name: TSchemaName;
  public readonly references: TSchemaName;

  static find(name: TSchemaName): GapSchema {
    return Schema.get<TSchemaName, GapSchema>(name);
  }
}
