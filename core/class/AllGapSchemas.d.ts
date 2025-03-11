import { SchemaInterface, TNetwork, TSchemaName } from '../types';
import { GapSchema } from './GapSchema';
export declare class AllGapSchemas {
    allSchemas: {
        [network: string]: SchemaInterface<TSchemaName>[];
    };
    constructor();
    findSchema(name: TSchemaName, network: TNetwork): GapSchema;
}
