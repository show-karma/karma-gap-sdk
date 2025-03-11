import { TNetwork } from "../../types";
import { AxiosGQL } from "./AxiosGQL";
interface EASClientProps {
    network: TNetwork;
}
export declare class EASClient extends AxiosGQL implements EASClientProps {
    private readonly _network;
    constructor(args: EASClientProps);
    /**
     * Validate the constructor arguments
     * @param args
     */
    private assert;
    get network(): TNetwork;
}
export {};
