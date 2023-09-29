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
      }) {${attestationFields}}
    }`,
  attestations: (schemaId: Hex, uid: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(where: {
        revoked: {equals: false}
        decodedDataJson: {contains: "${uid}"}
      }) {${attestationFields}}`
    ),
  attestationsIn: (uids: Hex[], search?: string) => `
    {
      attestations(where: {
        id:{in: ${inStatement(uids)}}
        revoked:{equals:false}
        ${
          search
            ? `decodedDataJson:{contains:"${search}",mode:insensitive}`
            : ""
        }
      }) {${attestationFields}}
    }`,
  attestationsFrom: (schemaId: Hex, attester: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(orderBy:{timeCreated: desc},
        where:{attester:{equals:"${attester}"}
        revoked:{equals:false}
      }){${attestationFields}}`
    ),
  attestationsTo: (schemaId: Hex, recipient: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(orderBy:{timeCreated: desc},
        where:{
          recipient:{equals:"${recipient}"}
          revoked:{equals:false}
        }){${attestationFields}}`
    ),
  attestationPairs: (schemaId: Hex, attester: Hex, recipient: Hex) =>
    schemaQuery(
      schemaId,
      `attestations(where: {
          attester: {equals: "${attester}"}
          recipient: {equals: "${recipient}"}
          revoked: {equals: false}
        }) {${attestationFields}}`
    ),
  attestationsOf: (
    schemaId: Hex,
    search?: string[] | string,
    refUids?: Hex[]
  ) =>
    schemaQuery(
      schemaId,
      `attestations(orderBy:{timeCreated: desc},
        where: {
          revoked:{equals:false}
          ${
            refUids && refUids.length
              ? `refUID:{in: ${inStatement(refUids)}}`
              : ""
          }
          ${
            search
              ? `OR: [
                ${[search]
                  .flat()
                  .map(
                    (s) =>
                      `{decodedDataJson:{contains:"${s}",mode:insensitive}}`
                  )
                  .join(",")}
              ]`
              : ""
          }
        })
        {${attestationFields}}`
    ),

  dependentsOf: (
    refs: Hex | Hex[],
    schemaIds: Hex[],
    attesters: Hex[] = []
  ) => `
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
