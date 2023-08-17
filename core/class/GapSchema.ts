import { IGapSchema, TSchemaName } from "../types";
import { Schema } from "./Schema";

export class GapSchema extends Schema implements IGapSchema {
  public readonly name: TSchemaName;
  public readonly references: TSchemaName;

  static find(name: TSchemaName): GapSchema {
    return Schema.get<TSchemaName, GapSchema>(name);
  }

  /**
   * Find many schemas by name and return them as an array in the same order.
   * @param names
   * @returns
   */
  static findMany(names: TSchemaName[]): GapSchema[] {
    return Schema.getMany<TSchemaName, GapSchema>(names);
  }
}
