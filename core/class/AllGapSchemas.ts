import { MountEntities, Networks } from "../../core/consts";
import { SchemaInterface, TNetwork, TSchemaName } from "../types";
import { GAP } from "./GAP";
import { GapSchema } from "./GapSchema";

export class AllGapSchemas {
  public allSchemas: { [network: string]: SchemaInterface<TSchemaName>[] } = {};

  constructor() {
    Object.keys(Networks).forEach((network) => {
      this.allSchemas[network] = Object.values(
        MountEntities(Networks[network])
      );
    });
  }

  findSchema(name: TSchemaName, network: TNetwork) {
    const schema = this.allSchemas[network].find((s) => s.name === name);
    return new GapSchema(schema, GAP.getInstance({ network }), false, false);
  }
}
