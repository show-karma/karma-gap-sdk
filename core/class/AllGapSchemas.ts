import { MountEntities, Networks } from "../../core/consts";
import { SchemaInterface, TNetwork, TSchemaName } from "../types";
import { GAP } from "./GAP";
import { GapSchema } from "./GapSchema";
import { SchemaError, SchemaNetworkError } from "./SchemaError";

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
    const networkSchemas = this.allSchemas[network];

    if (!networkSchemas) {
      throw new SchemaNetworkError(network, Object.keys(this.allSchemas));
    }

    const schema = networkSchemas.find((s) => s.name === name);

    if (!schema) {
      throw new SchemaError(
        "SCHEMA_NOT_FOUND",
        `Schema ${name} not found for network "${network}". Available schemas: ${networkSchemas
          .map((s) => s.name)
          .join(", ")}`
      );
    }

    return new GapSchema(schema, GAP.getInstance({ network }), false, false);
  }
}
