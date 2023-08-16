import { Hex } from "core/types";

const attestationFields = `
    uid: id
    attester
    data
    decodedDataJson
    recipient
    revoked
    createdAt: timeCreated
    references: refUID
    isOffchain
    revocable
    revocationTime
    schemaId
`;

const schemaQuery = (schemaId: Hex, content: string) =>
  `{schema(where: {id: "${schemaId}"}) {${content}}}`;

export const gqlQueries = {
  attestation: (uid: Hex) => `
    {
      attestation(where: {
        id: "${uid}"
      }) {${attestationFields}}
    }
  `,
  attestationsFrom: (schemaId: Hex, attester: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(where:{attester:{equals:"${attester}"}}){${attestationFields}}`
    ),
  attestationsOf: (schemaId: Hex, recipient: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(where:{recipient:{equals:"${recipient}"}}){${attestationFields}}`
    ),
  attestations: (schemaId: Hex, search?: string) =>
    schemaQuery(
      schemaId,
      `attestations
            ${
              search
                ? `(where: {
                    decodedDataJson: {
                        contains: "${search}"
                    }
                })`
                : ""
            }
        {${attestationFields}}`
    ),
  schemata: (creator: Hex) => `
    {
        schemata(where: {creator: {equals: "${creator}"}}) {
            uid: id
            schema
        }
    }`,
};
