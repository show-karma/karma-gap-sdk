import { AllGapSchemas } from "../class/AllGapSchemas";
import { Schema } from "../class/Schema";
import {
  SchemaError,
  SchemaNetworkError,
  UnsupportedChainError,
} from "../class/SchemaError";
import {
  networkOfChain,
  requireNetworkOfChain,
} from "../utils/network-of-chain";
import { TNetwork } from "../types";

describe("AllGapSchemas.findSchema", () => {
  const allSchemas = new AllGapSchemas();

  it("returns the schema for a supported network", () => {
    const schema = allSchemas.findSchema("Project", "optimism");

    expect(schema.name).toBe("Project");
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an unmapped network", "filecoin"],
  ])("throws a named error for %s", (_label, network) => {
    expect(() =>
      allSchemas.findSchema("Project", network as unknown as TNetwork)
    ).toThrow(SchemaNetworkError);
  });

  it("names the offending network in the error message", () => {
    expect(() =>
      allSchemas.findSchema("Project", "filecoin-314" as unknown as TNetwork)
    ).toThrow(/filecoin-314/);
  });

  it("lists the available networks in the error message", () => {
    expect(() =>
      allSchemas.findSchema("Project", undefined as unknown as TNetwork)
    ).toThrow(/Available networks: .*optimism/);
  });

  it("exposes a distinct error name so callers can branch on it", () => {
    try {
      allSchemas.findSchema("Project", undefined as unknown as TNetwork);
      throw new Error("expected findSchema to throw");
    } catch (error) {
      expect((error as Error).name).toBe("SchemaNetworkError");
      expect(error).toBeInstanceOf(SchemaError);
      expect(error).not.toBeInstanceOf(TypeError);
    }
  });

  it("throws a schema-not-found error for an unknown schema on a known network", () => {
    expect(() =>
      allSchemas.findSchema("NotASchema" as never, "optimism")
    ).toThrow(/NotASchema/);
  });
});

describe("Schema statics", () => {
  const UNKNOWN_NETWORK = "filecoin" as unknown as TNetwork;

  it.each([
    ["exists", () => Schema.exists("Project", UNKNOWN_NETWORK)],
    ["getAll", () => Schema.getAll(UNKNOWN_NETWORK)],
    ["get", () => Schema.get("Project", UNKNOWN_NETWORK)],
    ["getNames", () => Schema.getNames(UNKNOWN_NETWORK)],
    ["validate", () => Schema.validate(UNKNOWN_NETWORK)],
    ["add", () => Schema.add(UNKNOWN_NETWORK)],
  ])("%s throws a named error for an unregistered network", (_label, call) => {
    expect(call).toThrow(SchemaNetworkError);
    expect(call).toThrow(/filecoin/);
  });

  it("still resolves schemas for a registered network", () => {
    // A GAP instance registers the schemas for its network.
    new AllGapSchemas().findSchema("Project", "optimism");

    expect(Schema.getNames("optimism")).toContain("Project");
    expect(Schema.exists("Project", "optimism")).toBeDefined();
    expect(Schema.getAll("optimism").length).toBeGreaterThan(0);
    expect(Schema.get("Project", "optimism").name).toBe("Project");
  });
});

describe("networkOfChain", () => {
  it("maps a supported chain id to its network", () => {
    expect(networkOfChain(10, "celo")).toBe("optimism");
    expect(networkOfChain(42220, "optimism")).toBe("celo");
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["unmapped (filecoin)", 314],
    ["unmapped (mainnet)", 1],
  ])("falls back to the caller network when the chain id is %s", (_l, chainId) => {
    expect(networkOfChain(chainId as number | undefined | null, "optimism")).toBe(
      "optimism"
    );
  });

  it("does not treat chain id 0 as a supported chain", () => {
    expect(networkOfChain(0, "optimism")).toBe("optimism");
  });
});

describe("requireNetworkOfChain", () => {
  it("resolves a supported chain id", () => {
    expect(requireNetworkOfChain(42161, "ctx")).toBe("arbitrum");
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["unmapped", 314],
  ])("throws a named error when the chain id is %s", (_label, chainId) => {
    expect(() =>
      requireNetworkOfChain(chainId as number | undefined | null, "Project.ghost")
    ).toThrow(UnsupportedChainError);
  });

  it("names the offending chain id and the calling context", () => {
    expect(() => requireNetworkOfChain(314, "Project.attestGhostProject")).toThrow(
      /Project\.attestGhostProject: chain id 314 is not supported/
    );
  });
});
