import { Hex } from "core/types";

const inStatement = (values: (string | number)[]) =>
  `[${values.map((v) => `"${v}"`).join(",")}]`;

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
      `attestations(orderBy:{timeCreated: desc},
        where:{attester:{equals:"${attester}"},revoked:{equals:false}}){${attestationFields}}`
    ),
  attestationsOf: (schemaId: Hex, recipient: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(orderBy:{timeCreated: desc},
        where:{recipient:{equals:"${recipient}"},revoked:{equals:false}}){${attestationFields}}`
    ),
  attestations: (schemaId: Hex, search?: string) =>
    schemaQuery(
      schemaId,
      `attestations(orderBy:{timeCreated: desc},
        where: {
          revoked:{equals:false}
          ${search ? `decodedDataJson:{contains:"${search}"}` : ""}
        })
        {${attestationFields}}`
    ),

  dependentsOf: (refs: Hex | Hex[], schemaIds: Hex[]) => `
    {
      attestations(
        where: {
          refUID:{in: ${inStatement([refs].flat())}}
          revoked:{equals: false}
          schemaId:{in: ${inStatement(schemaIds)}}
      }){${attestationFields}}
    }
  `,
  schemata: (creator: Hex) => `
    {
        schemata(where: {creator: {equals: "${creator}"}}) {
            uid: id
            schema
        }
    }`,
};
