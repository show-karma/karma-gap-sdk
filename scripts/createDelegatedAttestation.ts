import { EAS, SchemaEncoder, NO_EXPIRATION } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

// EAS Contract address on Optimism Sepolia
const EAS_CONTRACT_ADDRESS = '0x4200000000000000000000000000000000000021';

// Schema UID for the community attestation
const SCHEMA_UID = '0x314bb1c3c9b5311c1b813a3ad123b6ac5a03902b987795056dd2e4ff38e833ea';

async function createDelegatedAttestation() {
    try {
        // Initialize provider for Optimism Sepolia
        const provider = new ethers.JsonRpcProvider('https://sepolia.optimism.io');
        
        // 0x5A4830885f12438E00D8f4d98e9Fe083e707698C
        const sender = new ethers.Wallet("0x98f6ff7002240e302cee6665286079adb4dba0d49a8f927c1b9f5d622bae9939", provider);

        // 0x99415E3376E22Ce03B8f40d338104d05Ab40b22e
        const payer = new ethers.Wallet("0x7dabe28f94453a5714ee1fb51708ea3847d45379c1686b32dd56f45a5f2fcaef", provider);
        
        // Initialize EAS
        const eas = new EAS(EAS_CONTRACT_ADDRESS);
        eas.connect(payer);

        // Get delegated instance
        const delegated = await eas.getDelegated();

        // Initialize schema encoder
        const schemaEncoder = new SchemaEncoder('bool community');
        const encodedData = schemaEncoder.encodeData([
            { name: 'community', value: true, type: 'bool' }
        ]);

        console.log('Encoded data:', encodedData);

        // Create the attestation request
        const attestationRequest = {
            schema: SCHEMA_UID,
            recipient: '0x7916Dba3A610B020d77c0CCFd4Bd717ee400A5f2',
            expirationTime: ethers.toBigInt(0),
            revocable: true,
            refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
            data: encodedData,
            value: ethers.toBigInt(0),
            deadline: ethers.toBigInt(0)
        };

        console.log('Attestation request:', attestationRequest);

        // Sign the attestation
        const response = await delegated.signDelegatedAttestation(attestationRequest, sender);
        console.log('Signature response:', response);

        // Submit the attestation
        const transaction = await eas.attestByDelegation({
            schema: SCHEMA_UID,
            data: {
                recipient: '0x7916Dba3A610B020d77c0CCFd4Bd717ee400A5f2',
                expirationTime: ethers.toBigInt(0),
                revocable: true,
                refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
                data: encodedData
            },
            signature: response.signature,
            attester: await sender.getAddress(),
            deadline: ethers.toBigInt(0)
        });

        const newAttestationUID = await transaction.wait();
        console.log('New attestation UID:', newAttestationUID);
        console.log('Transaction:', transaction);
    } catch (error) {
        console.error('Error creating delegated attestation:', error);
        throw error;
    }
}

// Execute the function
createDelegatedAttestation()
    .then(() => console.log('Delegated attestation created successfully'))
    .catch((error) => console.error('Failed to create delegated attestation:', error)); 