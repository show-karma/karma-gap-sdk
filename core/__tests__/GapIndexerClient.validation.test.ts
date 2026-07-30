// Imported through the package barrel on purpose: `core/index.ts` loads `GAP`
// before the entity modules, which is the order that resolves the pre-existing
// Schema <-> GapContract <-> GAP import cycle.
import { GAP } from "../index";
import { GapIndexerClient } from "../class/karma-indexer/GapIndexerClient";
import { GapIndexerApi } from "../class/karma-indexer/api/GapIndexerApi";
import {
  GapIndexerError,
  InvalidIdentifierError,
  MalformedResponseError,
} from "../class/karma-indexer/GapIndexerError";

/**
 * Regression coverage for GAP-FRONTEND-261: the indexer answered 200 with an
 * empty body (gzip outage) and with a bare array (blank slug hitting the
 * collection route). Both used to reach the entity mappers and crash with
 * `TypeError: Cannot read properties of undefined (reading 'find')`.
 */

const UID = "0x1111111111111111111111111111111111111111111111111111111111111111";
const ADDRESS = "0x2222222222222222222222222222222222222222";

function attestationBase(chainID: number) {
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

const MALFORMED_BODIES: [string, unknown][] = [
  ["an empty string", ""],
  ["an array", []],
  ["a populated array", [attestationBase(10)]],
  ["an empty object", {}],
  ["null", null],
  ["undefined", undefined],
  ["an error object", { error: "Bad Gateway", statusCode: 502 }],
  ["an HTML string", "<html><body>502</body></html>"],
  ["an object with a non-numeric chainID", { ...attestationBase(10), chainID: "10" }],
];

const BLANK_IDENTIFIERS: [string, string][] = [
  ["an empty string", ""],
  ["whitespace", "   "],
];

describe("GapIndexerClient response validation", () => {
  let client: GapIndexerClient;

  beforeEach(() => {
    client = new GapIndexerClient("https://indexer.test" as never);
    // eslint-disable-next-line no-new
    new GAP({ network: "optimism", apiClient: client });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("projectBySlug", () => {
    it.each(MALFORMED_BODIES)(
      "throws a named error when the body is %s",
      async (_label, body) => {
        const spy = jest
          .spyOn(GapIndexerApi.prototype, "projectBySlug")
          .mockResolvedValue({ data: body } as never);

        await expect(client.projectBySlug("my-project")).rejects.toBeInstanceOf(
          MalformedResponseError
        );
        await expect(client.projectBySlug("my-project")).rejects.not.toBeInstanceOf(
          TypeError
        );
        expect(spy).toHaveBeenCalled();
      }
    );

    it("includes the requested identifier in the error message", async () => {
      jest
        .spyOn(GapIndexerApi.prototype, "projectBySlug")
        .mockResolvedValue({ data: "" } as never);

      await expect(client.projectBySlug("gitcoin-passport")).rejects.toThrow(
        /gitcoin-passport/
      );
    });

    it.each(BLANK_IDENTIFIERS)(
      "throws before any network call when the slug is %s",
      async (_label, slug) => {
        const spy = jest.spyOn(GapIndexerApi.prototype, "projectBySlug");

        await expect(client.projectBySlug(slug)).rejects.toBeInstanceOf(
          InvalidIdentifierError
        );
        expect(spy).not.toHaveBeenCalled();
      }
    );

    it("maps a valid single-entity body unchanged", async () => {
      jest.spyOn(GapIndexerApi.prototype, "projectBySlug").mockResolvedValue({
        data: {
          ...attestationBase(10),
          type: "Project",
          data: { project: true },
        },
      } as never);

      const project = await client.projectBySlug("my-project");

      expect(project.uid).toBe(UID);
      expect(project.chainID).toBe(10);
      expect(project.schema.name).toBe("Project");
    });
  });

  describe("projectById", () => {
    it("throws before any network call for a blank uid", async () => {
      const spy = jest.spyOn(GapIndexerApi.prototype, "projectBySlug");

      await expect(client.projectById("" as never)).rejects.toBeInstanceOf(
        InvalidIdentifierError
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("throws a named error for a malformed body", async () => {
      jest
        .spyOn(GapIndexerApi.prototype, "projectBySlug")
        .mockResolvedValue({ data: [] } as never);

      await expect(client.projectById(UID as never)).rejects.toBeInstanceOf(
        MalformedResponseError
      );
    });
  });

  describe("communityBySlug", () => {
    it.each(MALFORMED_BODIES)(
      "throws a named error when the body is %s",
      async (_label, body) => {
        jest
          .spyOn(GapIndexerApi.prototype, "communityBySlug")
          .mockResolvedValue({ data: body } as never);

        await expect(client.communityBySlug("a-community")).rejects.toBeInstanceOf(
          MalformedResponseError
        );
      }
    );

    it("throws before any network call for a blank slug", async () => {
      const spy = jest.spyOn(GapIndexerApi.prototype, "communityBySlug");

      await expect(client.communityBySlug("")).rejects.toBeInstanceOf(
        InvalidIdentifierError
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("maps a valid single-entity body unchanged", async () => {
      jest.spyOn(GapIndexerApi.prototype, "communityBySlug").mockResolvedValue({
        data: {
          ...attestationBase(10),
          type: "Community",
          data: { community: true },
        },
      } as never);

      const community = await client.communityBySlug("a-community");

      expect(community.uid).toBe(UID);
      expect(community.schema.name).toBe("Community");
    });
  });

  describe("attestation", () => {
    it("throws before any network call for a blank uid", async () => {
      const spy = jest.spyOn(GapIndexerApi.prototype, "attestation");

      await expect(client.attestation("" as never)).rejects.toBeInstanceOf(
        InvalidIdentifierError
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it("throws a named error for an empty body", async () => {
      jest
        .spyOn(GapIndexerApi.prototype, "attestation")
        .mockResolvedValue({ data: "" } as never);

      await expect(client.attestation(UID as never)).rejects.toBeInstanceOf(
        MalformedResponseError
      );
    });
  });

  describe("list fetchers", () => {
    it("throws a named error when a list body is not an array", async () => {
      jest
        .spyOn(GapIndexerApi.prototype, "projects")
        .mockResolvedValue({ data: "" } as never);

      await expect(client.projects()).rejects.toBeInstanceOf(
        MalformedResponseError
      );
    });

    it("throws a named error naming the offending index for a bad item", async () => {
      jest.spyOn(GapIndexerApi.prototype, "projects").mockResolvedValue({
        data: [{ ...attestationBase(10), type: "Project", data: {} }, "oops"],
      } as never);

      await expect(client.projects()).rejects.toThrow(/Projects\[1\]/);
    });

    it("maps a valid list body unchanged", async () => {
      jest.spyOn(GapIndexerApi.prototype, "projects").mockResolvedValue({
        data: [
          { ...attestationBase(10), type: "Project", data: { project: true } },
        ],
      } as never);

      const projects = await client.projects();

      expect(projects).toHaveLength(1);
      expect(projects[0].uid).toBe(UID);
    });

    it("unwraps and validates the paginated grants-by-community body", async () => {
      jest
        .spyOn(GapIndexerApi.prototype, "grantsByCommunity")
        .mockResolvedValue({ data: {} } as never);

      await expect(client.grantsByCommunity(UID as never)).rejects.toBeInstanceOf(
        MalformedResponseError
      );
    });

    it("throws before any network call for a blank community uid", async () => {
      const spy = jest.spyOn(GapIndexerApi.prototype, "grantsByCommunity");

      await expect(client.grantsByCommunity("" as never)).rejects.toBeInstanceOf(
        InvalidIdentifierError
      );
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("guarded fetchers", () => {
    type ApiMethod = keyof GapIndexerApi;

    const listFetchers: [string, ApiMethod, () => Promise<unknown>][] = [
      ["communities", "communities", () => client.communities()],
      [
        "communitiesOf",
        "communitiesOf",
        () => client.communitiesOf(ADDRESS as never, false),
      ],
      ["adminOf", "adminOf", () => client.adminOf(ADDRESS as never)],
      ["searchProjects", "searchProjects", () => client.searchProjects("q")],
      [
        "projectsOf",
        "projectsOf",
        () => client.projectsOf(ADDRESS as never),
      ],
      [
        "projectMilestones",
        "projectMilestones",
        () => client.projectMilestones("a-project"),
      ],
      [
        "grantsOf",
        "grantsOf",
        () => client.grantsOf(ADDRESS as never, false),
      ],
      [
        "grantsForExtProject",
        "grantsForExtProject",
        () => client.grantsForExtProject("ext-1"),
      ],
      [
        "grantsFor",
        "grantsFor",
        () => client.grantsFor([{ uid: UID }] as never),
      ],
      [
        "milestonesOf",
        "milestonesOf",
        () => client.milestonesOf([{ uid: UID }] as never),
      ],
    ];

    it.each(listFetchers)(
      "%s throws a named error on a non-array body",
      async (_label, apiMethod, call) => {
        jest
          .spyOn(GapIndexerApi.prototype, apiMethod as never)
          .mockResolvedValue({ data: "" } as never);

        await expect(call()).rejects.toBeInstanceOf(MalformedResponseError);
      }
    );

    it.each(listFetchers)(
      "%s maps an empty list without throwing",
      async (_label, apiMethod, call) => {
        jest
          .spyOn(GapIndexerApi.prototype, apiMethod as never)
          .mockResolvedValue({ data: [] } as never);

        await expect(call()).resolves.toEqual([]);
      }
    );

    const identifierGuards: [string, () => Promise<unknown>][] = [
      ["communitiesOf", () => client.communitiesOf("" as never, false)],
      ["adminOf", () => client.adminOf("" as never)],
      ["communitiesAdminOf", () => client.communitiesAdminOf("" as never, false)],
      ["communityAdmins", () => client.communityAdmins("" as never)],
      ["projectsOf", () => client.projectsOf("" as never)],
      ["projectMilestones", () => client.projectMilestones("  ")],
      ["grantsOf", () => client.grantsOf("" as never, false)],
      ["grantsForExtProject", () => client.grantsForExtProject("")],
      ["grantsFor", () => client.grantsFor([] as never)],
      ["milestonesOf", () => client.milestonesOf([] as never)],
    ];

    it.each(identifierGuards)(
      "%s rejects a blank identifier before any network call",
      async (_label, call) => {
        await expect(call()).rejects.toBeInstanceOf(InvalidIdentifierError);
      }
    );
  });

  it("exposes a single catchable base error for both failure modes", async () => {
    jest
      .spyOn(GapIndexerApi.prototype, "projectBySlug")
      .mockResolvedValue({ data: "" } as never);

    await expect(client.projectBySlug("x")).rejects.toBeInstanceOf(
      GapIndexerError
    );
    await expect(client.projectBySlug("")).rejects.toBeInstanceOf(
      GapIndexerError
    );
  });
});
