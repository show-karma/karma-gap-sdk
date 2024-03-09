import {  SchemaInterface, TNetwork, TSchemaName } from '../types';
import { MountEntities, Networks } from '../../core/consts';
import { GapSchema } from './GapSchema';
import { GAP } from './GAP';


export class AllGapSchemas {
  public allSchemas: {[network: string]: SchemaInterface<TSchemaName>[] } = {};
  
  constructor() {
    Object.keys(Networks).forEach((network) => {
      this.allSchemas[network] = Object.values(MountEntities(Networks[network]));
    });
  }

  findSchema(name: TSchemaName, network: TNetwork) {
    const schema = this.allSchemas[network].find(s => s.name === name);
    return new GapSchema(
      schema,
      new GAP({ network: network }),
      false,
      false
    )
  }
}
