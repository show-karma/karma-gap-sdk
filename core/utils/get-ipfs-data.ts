import axios from 'axios';

export async function getIPFSData<T>(cid: string): Promise<T> {
  try {
    const { data } = await axios.get(`https://ipfs.io/ipfs/${cid}`, {
      timeout: 5000,
    });
    return data as T;
  } catch (err) {
    console.error(err);
    throw new Error(`Error to retrive data for CID: ${cid}`);
  }
}
