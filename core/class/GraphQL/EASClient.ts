import { Networks } from "../../consts";
import { EASNetworkConfig, Hex, TNetwork } from "../../types";
import { AxiosGQL } from "./AxiosGQL";
import { ethers } from "ethers";

interface EASClientProps {
  network: TNetwork;
  owner: Hex;
}

export class EASClient extends AxiosGQL implements EASClientProps {
  private readonly _network: EASNetworkConfig & { name: TNetwork };
  private readonly _owner: Hex;

  constructor(args: EASClientProps) {
    const { network, owner } = args;
    super(Networks[network].url);

    this.assert(args);

    this._owner = owner;
    this._network = { ...Networks[network], name: network };
  }

  /**
   * Validate the constructor arguments
   * @param args
   */
  private assert(args: EASClientProps) {
    if (!ethers.utils.isAddress(args.owner)) {
      throw new Error("Invalid owner address");
    }

    if (!Networks[args.network]) {
      throw new Error("Invalid network");
    }
  }

  get network(): TNetwork {
    return this._network.name;
  }

  get owner(): Hex {
    return this._owner;
  }
}
