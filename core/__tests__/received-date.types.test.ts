import type { IGrantDetails as IAttestationGrantDetails } from "../class/types/attestations";
import type { IGrantDetails as IIndexerGrantDetails } from "../class/karma-indexer/api/types";

const attestationGrantDetails: IAttestationGrantDetails = {
  title: "Grant",
  proposalURL: "https://example.com",
  type: "grant-details",
  receivedDate: 1704844800
};

const indexerGrantDetails: IIndexerGrantDetails = {
  id: "attestation-id",
  uid: "0x1111111111111111111111111111111111111111111111111111111111111111",
  schemaUID:
    "0x2222222222222222222222222222222222222222222222222222222222222222",
  refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
  attester:
    "0x3333333333333333333333333333333333333333333333333333333333333333",
  recipient:
    "0x4444444444444444444444444444444444444444444444444444444444444444",
  revoked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chainID: 10,
  type: "GrantDetails",
  decodedDataJson: "{}",
  isOffchain: false,
  revocable: true,
  schemaId:
    "0x5555555555555555555555555555555555555555555555555555555555555555",
  data: {
    title: "Grant",
    amount: "1000",
    description: "Description",
    proposalURL: "https://example.com",
    payoutAddress:
      "0x6666666666666666666666666666666666666666666666666666666666666666",
    questions: [],
    type: "grant-details",
    receivedDate: 1704844800
  }
};

const attestationReceivedDate: number | undefined =
  attestationGrantDetails.receivedDate;
const indexerReceivedDate: number | undefined =
  indexerGrantDetails.data.receivedDate;

void attestationReceivedDate;
void indexerReceivedDate;
