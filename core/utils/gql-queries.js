"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gqlQueries = void 0;
const inStatement = (values) => `[${values.map((v) => `"${v}"`).join(",")}]`;
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
const schemaQuery = (schemaId, content) => `{schema(where: {id: "${schemaId}"}) {${content}}}`;
exports.gqlQueries = {
    attestation: (uid) => `
    {
      attestation(where: {
        id: "${uid}"
      }) {${attestationFields}}
    }`,
    attestations: (schemaId, uid) => schemaQuery(schemaId, `attestations(where: {
        revoked: {equals: false}
        decodedDataJson: {contains: "${uid}"}
      }) {${attestationFields}}`),
    attestationsIn: (uids, search) => `
    {
      attestations(where: {
        id:{in: ${inStatement(uids)}}
        revoked:{equals:false}
        ${search
        ? `decodedDataJson:{contains:"${search}",mode:insensitive}`
        : ""}
      }) {${attestationFields}}
    }`,
    attestationsFrom: (schemaId, attester) => schemaQuery(schemaId, `attestations(orderBy:{timeCreated: desc},
        where:{attester:{equals:"${attester}"}
        revoked:{equals:false}
      }){${attestationFields}}`),
    attestationsTo: (schemaId, recipient) => schemaQuery(schemaId, `attestations(orderBy:{timeCreated: desc},
        where:{
          recipient:{equals:"${recipient}"}
          revoked:{equals:false}
        }){${attestationFields}}`),
    attestationPairs: (schemaId, attester, recipient) => schemaQuery(schemaId, `attestations(where: {
          attester: {equals: "${attester}"}
          recipient: {equals: "${recipient}"}
          revoked: {equals: false}
        }) {${attestationFields}}`),
    attestationsOf: (schemaId, search, refUids) => schemaQuery(schemaId, `attestations(orderBy:{timeCreated: desc},
        where: {
          revoked:{equals:false}
          ${refUids && refUids.length
        ? `refUID:{in: ${inStatement(refUids)}}`
        : ""}
          ${search
        ? `OR: [
                ${[search]
            .flat()
            .map((s) => `{decodedDataJson:{contains:"${s}",mode:insensitive}}`)
            .join(",")}
              ]`
        : ""}
        })
        {${attestationFields}}`),
    dependentsOf: (refs, schemaIds, attesters = []) => `
    {
      attestations(
        orderBy:{timeCreated: desc},
        where: {
          refUID:{in: ${inStatement([refs].flat())}}
          revoked:{equals: false}
          schemaId:{in: ${inStatement(schemaIds)}}
          ${attesters.length ? `attester:{in:${inStatement(attesters)}}` : ""}
      }){${attestationFields}}
    }
  `,
    schemata: (creator) => `
    {
        schemata(where: {creator: {equals: "${creator}"}}) {
            uid: id
            schema
        }
    }`,
};