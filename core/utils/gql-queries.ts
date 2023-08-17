import { nullRef } from "../consts";
import { Hex } from "../types";

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
    refUID
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
        refUID: {notIn: ["${nullRef}"]}
      }) {${attestationFields}}
    }`,
  attestationsFrom: (schemaId: Hex, attester: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(orderBy:{timeCreated: desc},
        where:{attester:{equals:"${attester}"}
        revoked:{equals:false}
          refUID: {notIn: ["${nullRef}"]}
      }){${attestationFields}}`
    ),
  attestationsTo: (schemaId: Hex, recipient: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(orderBy:{timeCreated: desc},
        where:{
          recipient:{equals:"${recipient}"}
          revoked:{equals:false}
          refUID: {notIn: ["${nullRef}"]}
        }){${attestationFields}}`
    ),
  attestationPairs: (schemaId: Hex, attester: Hex, recipient: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(where: {
          attester: {equals: "${attester}"}
          recipient: {equals: "${recipient}"}
          revoked: {equals: false}
          refUID: {notIn: ["${nullRef}"]}
        }) {${attestationFields}}`
    ),
  attestationsOf: (schemaId: Hex, search?: string) =>
    schemaQuery(
      schemaId,
      `attestations(orderBy:{timeCreated: desc},
        where: {
          revoked:{equals:false}
          refUID: {notIn: ["${nullRef}"]}
          ${search ? `decodedDataJson:{contains:"${search}"}` : ""}
        })
        {${attestationFields}}`
    ),

  dependentsOf: (refs: Hex | Hex[], schemaIds: Hex[], attesters?: Hex[]) => `
    {
      attestations(
        where: {
          refUID:{in: ${inStatement([refs].flat())}}
          revoked:{equals: false}
          schemaId:{in: ${inStatement(schemaIds)}}
          ${attesters.length ? `attester:{in:${inStatement(attesters)}}` : ""}
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
