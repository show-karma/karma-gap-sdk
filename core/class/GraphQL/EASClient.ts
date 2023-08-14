import axios, { Axios, AxiosInstance } from "axios";
import { Network } from "../../consts";
import { EASNetworkConfig, Hex } from "../../types";
import { AxiosGQL } from "./AxiosGQL";
import { ethers } from "ethers";

interface EASClientProps {
  network: keyof typeof Network;
  owner: Hex;
}

export class EASClient extends AxiosGQL implements EASClientProps {
  private readonly _network: EASNetworkConfig & { name: string };
  private readonly _owner: Hex;

  constructor(args: EASClientProps) {
    const { network, owner } = args;
    super(Network[network].url);

    this.assert(args);

    this._owner = owner;
    this._network = { ...Network[network], name: network };
  }

  /**
   * Validate the constructor arguments
   * @param args
   */
  private assert(args: EASClientProps) {
    if (!ethers.utils.isAddress(args.owner)) {
      throw new Error("Invalid owner address");
    }

    if (!Network[args.network]) {
      throw new Error("Invalid network");
    }
  }

  get network(): keyof typeof Network {
    return this._network.name;
  }

  get owner(): Hex {
    return this._owner;
  }
}
