/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/core"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^core/(.*)$": "<rootDir>/core/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          target: "es2020",
          lib: ["es2020"],
          esModuleInterop: true,
          resolveJsonModule: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    "core/class/AllGapSchemas.ts",
    "core/class/Schema.ts",
    "core/class/SchemaError.ts",
    "core/class/karma-indexer/GapIndexerClient.ts",
    "core/class/karma-indexer/GapIndexerError.ts",
    "core/class/karma-indexer/response-guards.ts",
    "core/utils/network-of-chain.ts",
  ],
};
