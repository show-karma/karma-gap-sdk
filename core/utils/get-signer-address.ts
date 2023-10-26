import { SignerOrProvider } from 'core/types';

export async function getSignerAddress(signer: SignerOrProvider) {
  const address =
    signer.address || signer._address || (await signer.getAddress());
  if (!address)
    throw new Error('Signer does not provider either address or getAddress().');
  return address;
}
