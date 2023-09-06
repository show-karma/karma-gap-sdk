import { Networks } from "../../consts";
import { EASNetworkConfig, Hex, TNetwork } from "../../types";
import { AxiosGQL } from "./AxiosGQL";

interface EASClientProps {
  network: TNetwork;
}

export class EASClient extends AxiosGQL implements EASClientProps {
  private readonly _network: EASNetworkConfig & { name: TNetwork };

  constructor(args: EASClientProps) {
    const { network } = args;
    super(Networks[network].url);

    this.assert(args);

    this._network = { ...Networks[network], name: network };
  }

  /**
   * Validate the constructor arguments
   * @param args
   */
  private assert(args: EASClientProps) {
    if (!Networks[args.network]) {
      throw new Error("Invalid network");
    }
  }

  get network(): TNetwork {
    return this._network.name;
  }
}
