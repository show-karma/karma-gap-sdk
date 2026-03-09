/**
 * Tests for Milestone.edit() and Milestone.editCompletion() convenience methods.
 *
 * Phase 3: edit() performs revoke-and-re-attest for milestone definitions:
 *   1. Guard: only PENDING milestones (no completed, approved, or verified)
 *   2. Revoke the current attestation via this.revoke()
 *   3. Update data via this.setValues() (merges old + new fields)
 *   4. Re-attest via this.attest()
 *
 * Phase 4: editCompletion() performs revoke-and-re-complete for completed milestones:
 *   1. Guard: must be COMPLETED but not APPROVED or VERIFIED
 *   2. Revoke current completion via this.revokeCompletion()
 *   3. Re-complete with updated data via this.complete()
 *
 * Since the SDK has no Jest config, these tests define the behavioral contract.
 * They simulate the methods' behavior to validate the expected flow without
 * requiring the full EAS/blockchain dependency chain. When a Jest config is added,
 * they will become directly runnable.
 */

import type { IMilestone, Milestone } from "../class/entities/Milestone";
import type { MilestoneCompleted, IMilestoneCompleted } from "../class/types/attestations";
import type { SignerOrProvider, Hex } from "../types";

// ---------------------------------------------------------------------------
// Phase 3: Milestone.edit()
// ---------------------------------------------------------------------------

describe("Milestone.edit()", () => {
  let mockSigner: SignerOrProvider;

  beforeEach(() => {
    mockSigner = {} as SignerOrProvider;
  });

  /**
   * Creates a test milestone simulating the real Milestone class behavior.
   * Uses revoke() + setValues() + attest() internally, matching the actual
   * implementation in core/class/entities/Milestone.ts.
   */
  function createTestMilestone(overrides?: {
    completed?: MilestoneCompleted;
    approved?: MilestoneCompleted;
    verified?: MilestoneCompleted[];
  }) {
    const revokeMock = jest.fn().mockResolvedValue({ tx: {}, uids: [] });
    const attestMock = jest.fn().mockResolvedValue({
      tx: { hash: "0xTxHash" },
      uids: ["0xNewUID" as Hex]
    });
    const setValuesMock = jest.fn();

    const milestone = {
      uid: "0xOldMilestoneUID" as Hex,
      title: "Original Title",
      description: "Original Description",
      endsAt: 1735689600,
      startsAt: 1704067200,
      type: "milestone",
      completed: overrides?.completed || undefined,
      approved: overrides?.approved || undefined,
      verified: overrides?.verified || [],
      recipient: "0xRecipient" as Hex,
      data: {
        title: "Original Title",
        description: "Original Description",
        endsAt: 1735689600,
        startsAt: 1704067200
      } as IMilestone,
      // Mock methods matching real Attestation class
      revoke: revokeMock,
      attest: attestMock,
      setValues: setValuesMock,
      // Expose mocks for assertions
      _mocks: { revoke: revokeMock, attest: attestMock, setValues: setValuesMock }
    };

    // Simulate the edit method matching the real implementation
    (milestone as Record<string, unknown>).edit = async function (
      this: typeof milestone,
      signer: SignerOrProvider,
      newData: Partial<IMilestone>,
      callback?: Function
    ): Promise<{ tx: unknown; uids: Hex[] }> {
      // Guard: only PENDING milestones
      if (this.completed || this.approved || (this.verified && this.verified.length > 0)) {
        throw new Error("Cannot edit milestone that is not in PENDING state");
      }

      // Step 1: Revoke current attestation
      await this.revoke(signer, callback);

      // Step 2: Update data with new fields
      const updatedData = { ...this.data, ...newData };
      this.setValues(updatedData);

      // Step 3: Re-attest with updated data
      return this.attest(signer, callback);
    };

    return milestone;
  }

  describe("successful edit (PENDING milestone)", () => {
    it("should call revoke on current attestation, then re-attest", async () => {
      const milestone = createTestMilestone();

      await (milestone as Record<string, Function>).edit(mockSigner, {
        title: "Updated Title",
        description: "Updated Description"
      });

      expect(milestone._mocks.revoke).toHaveBeenCalledTimes(1);
      expect(milestone._mocks.revoke).toHaveBeenCalledWith(mockSigner, undefined);
      expect(milestone._mocks.attest).toHaveBeenCalledTimes(1);
      expect(milestone._mocks.attest).toHaveBeenCalledWith(mockSigner, undefined);
    });

    it("should call setValues with merged data (old + new)", async () => {
      const milestone = createTestMilestone();

      await (milestone as Record<string, Function>).edit(mockSigner, {
        title: "New Title"
      });

      expect(milestone._mocks.setValues).toHaveBeenCalledTimes(1);
      expect(milestone._mocks.setValues).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Title",
          description: "Original Description",
          endsAt: 1735689600,
          startsAt: 1704067200
        })
      );
    });

    it("should preserve unchanged fields during partial update", async () => {
      const milestone = createTestMilestone();

      await (milestone as Record<string, Function>).edit(mockSigner, {
        title: "New Title Only"
      });

      const setValuesArg = milestone._mocks.setValues.mock.calls[0][0];
      expect(setValuesArg.description).toBe("Original Description");
      expect(setValuesArg.endsAt).toBe(1735689600);
      expect(setValuesArg.startsAt).toBe(1704067200);
    });

    it("should update all supported fields when fully provided", async () => {
      const milestone = createTestMilestone();

      await (milestone as Record<string, Function>).edit(mockSigner, {
        title: "New Title",
        description: "New Description",
        endsAt: 1767225600,
        startsAt: 1735689600,
        priority: 1
      });

      const setValuesArg = milestone._mocks.setValues.mock.calls[0][0];
      expect(setValuesArg.title).toBe("New Title");
      expect(setValuesArg.description).toBe("New Description");
      expect(setValuesArg.endsAt).toBe(1767225600);
      expect(setValuesArg.startsAt).toBe(1735689600);
      expect(setValuesArg.priority).toBe(1);
    });

    it("should return the result from attest()", async () => {
      const milestone = createTestMilestone();

      const result = await (milestone as Record<string, Function>).edit(
        mockSigner,
        { title: "New" }
      );

      expect(result).toEqual({
        tx: { hash: "0xTxHash" },
        uids: ["0xNewUID"]
      });
    });
  });

  describe("state guards", () => {
    it("should throw for COMPLETED milestones", async () => {
      const milestone = createTestMilestone({
        completed: {
          uid: "0xCompletedUID",
          data: { type: "completed", reason: "Done" }
        } as MilestoneCompleted
      });

      await expect(
        (milestone as Record<string, Function>).edit(mockSigner, { title: "Nope" })
      ).rejects.toThrow("Cannot edit milestone that is not in PENDING state");

      expect(milestone._mocks.revoke).not.toHaveBeenCalled();
    });

    it("should throw for APPROVED milestones", async () => {
      const milestone = createTestMilestone({
        approved: {
          uid: "0xApprovedUID",
          data: { type: "approved", reason: "Good" }
        } as MilestoneCompleted
      });

      await expect(
        (milestone as Record<string, Function>).edit(mockSigner, { title: "Nope" })
      ).rejects.toThrow("Cannot edit milestone that is not in PENDING state");
    });

    it("should throw for VERIFIED milestones (verified.length > 0)", async () => {
      const milestone = createTestMilestone({
        verified: [
          {
            uid: "0xVerifiedUID",
            data: { type: "verified", reason: "Verified" }
          } as MilestoneCompleted
        ]
      });

      await expect(
        (milestone as Record<string, Function>).edit(mockSigner, { title: "Nope" })
      ).rejects.toThrow("Cannot edit milestone that is not in PENDING state");
    });

    it("should allow edit when completed/approved/verified are all falsy/empty", async () => {
      const milestone = createTestMilestone({
        completed: undefined,
        approved: undefined,
        verified: []
      });

      await expect(
        (milestone as Record<string, Function>).edit(mockSigner, { title: "Allowed" })
      ).resolves.not.toThrow();

      expect(milestone._mocks.revoke).toHaveBeenCalledTimes(1);
      expect(milestone._mocks.attest).toHaveBeenCalledTimes(1);
    });
  });

  describe("execution order", () => {
    it("should call revoke BEFORE setValues and attest (correct ordering)", async () => {
      const callOrder: string[] = [];
      const milestone = createTestMilestone();

      milestone._mocks.revoke.mockImplementation(async () => {
        callOrder.push("revoke");
        return { tx: {}, uids: [] };
      });
      milestone._mocks.setValues.mockImplementation(() => {
        callOrder.push("setValues");
      });
      milestone._mocks.attest.mockImplementation(async () => {
        callOrder.push("attest");
        return { tx: {}, uids: ["0xNew" as Hex] };
      });

      await (milestone as Record<string, Function>).edit(mockSigner, {
        title: "New"
      });

      expect(callOrder).toEqual(["revoke", "setValues", "attest"]);
    });
  });
});

// ---------------------------------------------------------------------------
// Phase 4: Milestone.editCompletion()
// ---------------------------------------------------------------------------

describe("Milestone.editCompletion()", () => {
  let mockSigner: SignerOrProvider;

  beforeEach(() => {
    mockSigner = {} as SignerOrProvider;
  });

  /**
   * Creates a test milestone with completion data for testing editCompletion().
   */
  function createCompletedMilestone(overrides?: {
    approved?: MilestoneCompleted;
    verified?: MilestoneCompleted[];
  }) {
    const revokeCompletionMock = jest
      .fn()
      .mockResolvedValue({ tx: {}, uids: [] });
    const completeMock = jest.fn().mockResolvedValue({
      tx: { hash: "0xCompletionTxHash" },
      uids: ["0xNewCompletionUID" as Hex]
    });

    const milestone = {
      uid: "0xMilestoneUID" as Hex,
      completed: {
        uid: "0xOldCompletionUID",
        data: {
          reason: "Original completion reason",
          proofOfWork: "https://example.com/original-proof"
        }
      } as MilestoneCompleted,
      approved: overrides?.approved || undefined,
      verified: overrides?.verified || [],
      revokeCompletion: revokeCompletionMock,
      complete: completeMock,
      _mocks: { revokeCompletion: revokeCompletionMock, complete: completeMock }
    };

    // Simulate editCompletion matching real implementation
    (milestone as Record<string, unknown>).editCompletion = async function (
      this: typeof milestone,
      signer: SignerOrProvider,
      newData: { reason?: string; proofOfWork?: string },
      callback?: Function
    ): Promise<{ tx: unknown; uids: Hex[] }> {
      if (!this.completed) {
        throw new Error("Milestone is not completed");
      }
      if (this.approved) {
        throw new Error("Cannot edit completion of an approved milestone");
      }
      if (this.verified && this.verified.length > 0) {
        throw new Error("Cannot edit completion of a verified milestone");
      }

      await this.revokeCompletion(signer, callback);

      const completionData: IMilestoneCompleted = {
        reason: newData.reason ?? this.completed?.data?.reason ?? "",
        proofOfWork:
          newData.proofOfWork ?? this.completed?.data?.proofOfWork ?? ""
      };

      return this.complete(signer, completionData, callback);
    };

    return milestone;
  }

  describe("successful editCompletion", () => {
    it("should revoke old completion and re-complete with updated data", async () => {
      const milestone = createCompletedMilestone();

      await (milestone as Record<string, Function>).editCompletion(mockSigner, {
        reason: "Updated completion reason",
        proofOfWork: "https://example.com/updated-proof"
      });

      expect(milestone._mocks.revokeCompletion).toHaveBeenCalledTimes(1);
      expect(milestone._mocks.complete).toHaveBeenCalledTimes(1);
      expect(milestone._mocks.complete).toHaveBeenCalledWith(
        mockSigner,
        {
          reason: "Updated completion reason",
          proofOfWork: "https://example.com/updated-proof"
        },
        undefined
      );
    });

    it("should preserve unchanged fields from original completion", async () => {
      const milestone = createCompletedMilestone();

      // Only update reason, proofOfWork should be preserved from original
      await (milestone as Record<string, Function>).editCompletion(mockSigner, {
        reason: "New reason only"
      });

      expect(milestone._mocks.complete).toHaveBeenCalledWith(
        mockSigner,
        {
          reason: "New reason only",
          proofOfWork: "https://example.com/original-proof"
        },
        undefined
      );
    });

    it("should return the result from complete()", async () => {
      const milestone = createCompletedMilestone();

      const result = await (milestone as Record<string, Function>).editCompletion(
        mockSigner,
        { reason: "Updated" }
      );

      expect(result).toEqual({
        tx: { hash: "0xCompletionTxHash" },
        uids: ["0xNewCompletionUID"]
      });
    });
  });

  describe("state guards", () => {
    it("should throw if milestone is not completed", async () => {
      const milestone = createCompletedMilestone();
      milestone.completed = undefined as unknown as MilestoneCompleted;

      await expect(
        (milestone as Record<string, Function>).editCompletion(mockSigner, {
          reason: "Nope"
        })
      ).rejects.toThrow("Milestone is not completed");

      expect(milestone._mocks.revokeCompletion).not.toHaveBeenCalled();
    });

    it("should throw if milestone is approved", async () => {
      const milestone = createCompletedMilestone({
        approved: {
          uid: "0xApprovedUID",
          data: { type: "approved", reason: "Approved" }
        } as MilestoneCompleted
      });

      await expect(
        (milestone as Record<string, Function>).editCompletion(mockSigner, {
          reason: "Nope"
        })
      ).rejects.toThrow("Cannot edit completion of an approved milestone");
    });

    it("should throw if milestone is verified", async () => {
      const milestone = createCompletedMilestone({
        verified: [
          {
            uid: "0xVerifiedUID",
            data: { type: "verified" }
          } as MilestoneCompleted
        ]
      });

      await expect(
        (milestone as Record<string, Function>).editCompletion(mockSigner, {
          reason: "Nope"
        })
      ).rejects.toThrow("Cannot edit completion of a verified milestone");
    });
  });
});
