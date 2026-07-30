import {
  GapIndexerError,
  InvalidIdentifierError,
  MalformedResponseError,
  SchemaNetworkError,
  UnsupportedChainError,
  networkOfChain,
} from "../index";

describe("public barrel", () => {
  it("exports the new error types and helper", () => {
    expect(GapIndexerError).toBeDefined();
    expect(InvalidIdentifierError).toBeDefined();
    expect(MalformedResponseError).toBeDefined();
    expect(SchemaNetworkError).toBeDefined();
    expect(UnsupportedChainError).toBeDefined();
    expect(networkOfChain(10, "celo")).toBe("optimism");
  });
});
