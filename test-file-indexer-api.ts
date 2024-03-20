import { GapIndexerApi } from './core/class/karma-indexer/api/GapIndexerApi';
const projectUID = '0x9860e2b0c7449ec266e354dd3c2e957f76c7180b018f6b430887756ffdd1d65e';


async function test(){ 
  const indexer = new GapIndexerApi('https://gapstagapi.karmahq.xyz');

  // const { data } = await indexer.grantsOf('0xD1Ab925ebb77A823f52f7e4f1Ab0A7EAeD7c010D');
  // const { data } = await indexer.projects('test');
  // const {data} = await indexer.milestonesOf(projectUID);
  // const {data} = await indexer.milestonesOf(projectUID);
  const {data} = await indexer.grantee('0x0cfecb5D359E6C59ABd1d2Aa794F52C15055f451')
  // console.log(JSON.stringify(communities));
  console.log(JSON.stringify(data))
}

test()


// Notes:
/**
 * 1. projects('test') returns db error
 * 2. Attestation createdAt types are mismatching (api: string, class: expects number)
 * 3. grantees() return type mismatch:
 *  expected: Grantee
 *  actual: {[key: Hex]: { projects: number; grants: number }}
 */