// Imported through the package barrel on purpose: `core/index.ts` loads `GAP`
// before the entity modules, which is the order that resolves the pre-existing
// Schema <-> GapContract <-> GAP import cycle. Importing an entity module
// directly leaves `Schema` undefined at class-extension time.
import { Grant, Milestone, Project } from "../index";
import type {
  IGrantResponse,
  IMilestoneResponse,
  IProjectResponse,
} from "../class/karma-indexer/api/types";

/**
 * Regression coverage for GAP-FRONTEND-261: an attestation whose `chainID` is
 * missing, null or on an unmapped chain (e.g. Filecoin 314) used to resolve to
 * an `undefined` network and blow up inside the schema registry with
 * `TypeError: Cannot read properties of undefined (reading 'find')`.
 */

const UID =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const ADDRESS = "0x2222222222222222222222222222222222222222";

function attestationBase(chainID: unknown) {
  return {
    uid: UID,
    schemaUID: UID,
    refUID: UID,
    attester: ADDRESS,
    recipient: ADDRESS,
    revoked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    chainID,
    isOffchain: false,
    revocable: true,
    schemaId: UID,
  };
}

const UNMAPPED_CHAINS: [string, unknown][] = [
  ["missing", undefined],
  ["null", null],
  ["filecoin (314)", 314],
  ["mainnet (1)", 1],
];

describe("Project.from", () => {
  it.each(UNMAPPED_CHAINS)(
    "maps an attestation with a %s chainID using the fallback network",
    (_label, chainID) => {
      const attestation = {
        ...attestationBase(chainID),
        type: "Project",
        data: { project: true },
      } as unknown as IProjectResponse;

      const [project] = Project.from([attestation], "optimism");

      expect(project.schema.name).toBe("Project");
      expect(project.schema.gap.network).toBe("optimism");
    }
  );

  it("keeps using the attestation chain for mapped chains", () => {
    const attestation = {
      ...attestationBase(42220),
      type: "Project",
      data: { project: true },
    } as unknown as IProjectResponse;

    const [project] = Project.from([attestation], "optimism");

    expect(project.schema.gap.network).toBe("celo");
  });

  it("maps nested details and members through the fallback network", () => {
    const attestation = {
      ...attestationBase(314),
      type: "Project",
      data: { project: true },
      details: {
        ...attestationBase(314),
        type: "ProjectDetails",
        data: { title: "A project", links: [], tags: [] },
      },
      members: [
        {
          ...attestationBase(314),
          type: "MemberOf",
          data: { memberOf: true },
          details: {
            ...attestationBase(314),
            type: "MemberDetails",
            data: { name: "Member" },
          },
        },
      ],
    } as unknown as IProjectResponse;

    const [project] = Project.from([attestation], "celo");

    expect(project.details?.schema.gap.network).toBe("celo");
    expect(project.members[0].details?.schema.gap.network).toBe("celo");
  });
});

describe("Grant.from", () => {
  it.each(UNMAPPED_CHAINS)(
    "maps an attestation with a %s chainID using the fallback network",
    (_label, chainID) => {
      const attestation = {
        ...attestationBase(chainID),
        type: "Grant",
        data: { communityUID: UID },
      } as unknown as IGrantResponse;

      const [grant] = Grant.from([attestation], "optimism");

      expect(grant.schema.name).toBe("Grant");
      expect(grant.schema.gap.network).toBe("optimism");
    }
  );
});

describe("Milestone.from", () => {
  it.each(UNMAPPED_CHAINS)(
    "maps an attestation with a %s chainID using the fallback network",
    (_label, chainID) => {
      const attestation = {
        ...attestationBase(chainID),
        type: "Milestone",
        data: { title: "M1", description: "d", endsAt: 1704844800 },
      } as unknown as IMilestoneResponse;

      const [milestone] = Milestone.from([attestation], "optimism");

      expect(milestone.schema.name).toBe("Milestone");
      expect(milestone.schema.gap.network).toBe("optimism");
    }
  );

  it("maps the completed sub-attestation through the fallback network", () => {
    const attestation = {
      ...attestationBase(314),
      type: "Milestone",
      data: { title: "M1", description: "d", endsAt: 1704844800 },
      completed: {
        ...attestationBase(314),
        type: "MilestoneCompleted",
        data: { type: "completed", reason: "done" },
      },
    } as unknown as IMilestoneResponse;

    const [milestone] = Milestone.from([attestation], "celo");

    expect(milestone.completed?.schema.gap.network).toBe("celo");
  });
});
