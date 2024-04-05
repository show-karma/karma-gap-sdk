import { ethers } from "ethers";
import { GAP, nullRef } from "./core";
import { Community, GapIndexerClient, IpfsStorage } from "./core/class";
import fs from "fs";

const communities = [
  {
    "chainId": 10,
    "name": "NextGen of Optimism Stake | FutureProof Financing",
    "description": "QuantumStake: Revolutionizing Staking in the Crypto Sphere QuantumStake is a cutting-edge staking platform designed to redefine the staking experience for cryptocurrency enthusiasts. Our project boasts several key advantages over competitors, emphasizing innovation, security, and a commitment to addressing contemporary cryptocurrency challenges. Advantages Over Competitors: Advanced Technology Integration: QuantumStake leverages state-of-the-art technologies, including DeFi and NFT integrations, to offer stakers a multifaceted and dynamic experience. Our commitment to staying at the forefront of technological advancements ensures that users have access to the latest features and capabilities. Scalability and Partnerships: We prioritize scalability to accommodate a growing community of stakers. QuantumStake actively seeks strategic partnerships with other projects to expand the staking ecosystem and increase opportunities for our users. User-Friendly Interface: QuantumStake prides itself on a user-friendly interface, making staking accessible to both novices and experienced users. Our intuitive design and comprehensive guides ensure a seamless onboarding process. Community-Driven Development: We prioritize community involvement in decision-making processes. QuantumStake believes in the power of collaboration, and community feedback plays a pivotal role in shaping the evolution of our platform. Security Measures: Smart Contract Audits: QuantumStake undergoes rigorous smart contract audits by reputable third-party security firms. This commitment ensures the integrity and security of our staking protocols, providing users with confidence in the safety of their funds. Decentralized Architecture: Our platform operates on a decentralized architecture, mitigating the risks associated with centralized points of failure. This approach enhances security and resilience against potential attacks. Continuous Monitoring and Updates: QuantumStake employs a dedicated security team to continuously monitor and address potential vulnerabilities. Regular updates and improvements are implemented to enhance the overall security posture of the platform.",
    "imageURL": "",
    "slug": "nextgen-of-optimism-stake--futureproof-financing-10",
    "externalId": "0x3bebf3a7344f2f5a39e810a523bcba8f1001c3705d1705a6deaa2dc78aa35919",
    "rounds": [
      "QuantumStake: Revolutionizing Staking in the Crypto space | Optimism",
      "QuantumStake: Revolutionizing Staking in the Crypto Sphere"
    ]
  },
  {
    "chainId": 10,
    "name": "Fractal Visions",
    "description": "Fractal Visions Mission #1 is for fellow impact makers in web3 who are building projects that contribute to public goods. Utilizing the Optimism network and Layer 2 scaling blockchain technology with the Gitcoin Grants Stack gives Fractal Visions ecosystem the opportunity to reiterate Quadratic Funding with the \"Mission Fund\" as the public goods community grows. The community can choose from a selection of different categories that align with their vision and values regarding the future of blockchain development. The “Fractal Visions Mission Fund” further expands the scope of participation within the niche community of impact makers from the very early beginning of a regenerative movement. Each “Mission” from the Pilot Programs help contribute to momentum of the public goods flywheel every QF round. --- To be eligible for this grant round, applicants must meet the general eligibility policy and the following specific criteria. ---",
    "imageURL": "",
    "slug": "fractal-visions-10",
    "externalId": "0xecca9e84c2e866724696f9753cdcb7ed2df8edb92871ebf38236a6e840fd4891",
    "rounds": [
      "Mission #1"
    ]
  },
  {
    "chainId": 10,
    "name": "EcoSynthesisX QF rounds",
    "description": "Allo 2 protocol. EcoSynthesisX Spring round as a space for showcase public good projects, foster coordination and bring funding for bigger impact!  Experimental approach on public good funding utilizing hyperstructure vision and Gitcoin infrastructure. Open for applications. Our Discord https://discord.gg/qkSy83uf",
    "imageURL": "",
    "slug": "ecosynthesisx-qf-rounds-10",
    "externalId": "0x6c2402cc20967444d61900db0a5e4823d78be1eb379ca4942bb90b3d045f6690",
    "rounds": [
      "Allo 2 🌐♻️ EcoSynthesisX Spring Round on Optimism "
    ]
  },
  {
    "chainId": 10,
    "name": "LunCo V2",
    "description": "Testing V2 on LunCo Subsystems",
    "imageURL": "",
    "slug": "lunco-v2-10",
    "externalId": "0x247a54b0a03aefed0c1bcc514475ada35b37c0ea683a6d645238d65647c0690f",
    "rounds": [
      "LunCo (🌍🚀🌖) Subsystems"
    ]
  },
  {
    "chainId": 10,
    "name": "Token Engineering Commons Grant Program",
    "description": "The Token Engineering QF Grants Round: Spring 2024 aims to catalyze innovative token engineering ideas and early-stage projects to achieve proven impact in the token engineering space. In this round, we focus on research, education, software development and/or social infrastructure that advances the field of token engineering.  The TEC uses what we call “Tunable Quadratic Funding” (TQF) to allocate matching funds in our Gitcoin rounds. This approach enables us to incorporate token engineering expertise into the Quadratic Funding allocation process.",
    "imageURL": "",
    "slug": "token-engineering-commons-grant-program-10",
    "externalId": "0x5062f4043698dc6ca9448a54885d0229abbe11c196db66171d944dd247919980",
    "rounds": [
      "Token Engineering QF Grants Round: Spring 2024"
    ]
  },
  {
    "chainId": 42161,
    "name": "v2 GS Arbitrum Program",
    "description": "Submit your best meme about Gitcoin, grants, or public goods! We're testing out the new Allo v2 integration in advance of GG20. ",
    "imageURL": "",
    "slug": "v2-gs-arbitrum-program-42161",
    "externalId": "0x5e8c6a8e93be6efacef3dd2e8749f0d1711177ed5d94e32aa4bbf05b73a75969",
    "rounds": [
      "Gitcoin Meme Round"
    ]
  },
  {
    "chainId": 42161,
    "name": "NextGen of Arbitrum One Stake | FutureProof Financing",
    "description": "QuantumStake: Revolutionizing Staking in the Crypto Sphere QuantumStake is a cutting-edge staking platform designed to redefine the staking experience for cryptocurrency enthusiasts. Our project boasts several key advantages over competitors, emphasizing innovation, security, and a commitment to addressing contemporary cryptocurrency challenges. Advantages Over Competitors: Advanced Technology Integration: QuantumStake leverages state-of-the-art technologies, including DeFi and NFT integrations, to offer stakers a multifaceted and dynamic experience. Our commitment to staying at the forefront of technological advancements ensures that users have access to the latest features and capabilities. Scalability and Partnerships: We prioritize scalability to accommodate a growing community of stakers. QuantumStake actively seeks strategic partnerships with other projects to expand the staking ecosystem and increase opportunities for our users. User-Friendly Interface: QuantumStake prides itself on a user-friendly interface, making staking accessible to both novices and experienced users. Our intuitive design and comprehensive guides ensure a seamless onboarding process. Community-Driven Development: We prioritize community involvement in decision-making processes. QuantumStake believes in the power of collaboration, and community feedback plays a pivotal role in shaping the evolution of our platform. Security Measures: Smart Contract Audits: QuantumStake undergoes rigorous smart contract audits by reputable third-party security firms. This commitment ensures the integrity and security of our staking protocols, providing users with confidence in the safety of their funds. Decentralized Architecture: Our platform operates on a decentralized architecture, mitigating the risks associated with centralized points of failure. This approach enhances security and resilience against potential attacks. Continuous Monitoring and Updates: QuantumStake employs a dedicated security team to continuously monitor and address potential vulnerabilities. Regular updates and improvements are implemented to enhance the overall security posture of the platform.",
    "imageURL": "",
    "slug": "nextgen-of-arbitrum-one-stake--futureproof-financing-42161",
    "externalId": "0x05a2a98cbbe8547941d90b0c5cf569d77f6d337f7d3bb5f2ff921fb5b6fc83e7",
    "rounds": [
      "QuantumStake: Revolutionizing Staking in the Crypto space | Arbitrum One",
      "QuantumStake: Revolutionizing Staking in the Crypto Sphere"
    ]
  },
  {
    "chainId": 42161,
    "name": "EcoSynthesisX QF rounds",
    "description": "Allo 2 protocol. EcoSynthesisX Spring round as a space for showcase public good projects, foster coordination and bring funding for bigger impact!  Experimental approach on public good funding utilizing hyperstructure vision and Gitcoin infrastructure. Open for applications. Our Discord https://discord.gg/qkSy83uf\n",
    "imageURL": "",
    "slug": "ecosynthesisx-qf-rounds-42161",
    "externalId": "0xf62d85d35ac3b7a2190100f6d11b5942b55b73934dbf5c8cd04285d29673561e",
    "rounds": [
      "Allo 2 🌐♻️ EcoSynthesisX Spring Round on Arbitrum"
    ]
  },
  {
    "chainId": 42161,
    "name": "LunCo V2",
    "description": "Testing V2 on LunCo Subsystems",
    "imageURL": "",
    "slug": "lunco-v2-42161",
    "externalId": "0x94181fb1eaddb09d18f6b8d85a98df1b410d49b647271df7c4e20b044140fdd8",
    "rounds": [
      "LunCo (🌍🚀🌖) Subsystems"
    ]
  },
  {
    "chainId": 42161,
    "name": "Boiler's Steam Boat",
    "imageURL": "",
    "slug": "boilers-steam-boat-42161",
    "externalId": "0x168e3f56c72bc0964a3215b0180fd25f8ce26b809b7d59456f3ed0e9bb304613",
    "rounds": [
      null
    ]
  },
  {
    "chainId": 42161,
    "name": "GG20 OSS Program",
    "description": "To foster the growth and impact of open-source software (OSS) within the tech ecosystem, there's a growing need to support projects that have shown promising beginnings at recent hackathons. Recognizing this potential, the focus is on identifying and funding projects that align with several key target areas:\n\n1. Innovative Solutions or Prototypes: Priority will be given to projects that originated as innovative solutions or prototypes during hackathons. These projects should demonstrate a high potential for scalability, impact, and the ability to address complex challenges within the OSS ecosystem.\n\n2. Initiatives Addressing Clear Needs: The funding will also target initiatives addressing clear and identifiable needs within the OSS or broader tech ecosystem. This includes projects that offer new tools and improve end user experience.\n",
    "imageURL": "",
    "slug": "gg20-oss-program-42161",
    "externalId": "0xeaf418299b6aacff422d3ad8f561956116dfb3b5cca09ab15ffa56ed9dbb7330",
    "rounds": [
      "Hackathon Alumni",
      "dApps & Apps ",
      "Web3 Infrastructure",
      "Developer Tooling and Libraries"
    ]
  },
  {
    "chainId": 42161,
    "name": "ENS Identity",
    "description": "The GG20 ENS Identity Round round is meant to support projects actively building on top of ENS. Any project that is growing, enhancing, or supporting the decentralized identity system around ENS is eligible.",
    "imageURL": "",
    "slug": "ens-identity-42161",
    "externalId": "0xfb88ca703349b94e0e6af74ec1aec62db1a5b4f43abe1324e1158d36357147cf",
    "rounds": [
      "ENS Identity"
    ]
  },
  {
    "chainId": 42161,
    "name": "Hypercerts Ecosystem Round",
    "description": "This round aims to strengthen the Hypercerts Ecosystem to realize the vision of an interconnected impact funding network. We specifically want to support projects\n1. that integrate hypercerts into existing funding platforms—similar to the hypercerts integration with Gitcoin,\n2. that develop new applications like prize competitions leveraging the hypercerts infrastructure,\n3. that build tooling to extent the functionality for multiple integrations and applications, such as Deresy to coordinate evaluators, or\n4. that are tangible use cases piloting new functionalities, e.g. implementing retroactive funding rounds with hypercerts or using hyperboards.",
    "imageURL": "",
    "slug": "hypercerts-ecosystem-round-42161",
    "externalId": "0x3e3dfe4bd9070eb7600548d292f8211570e87e74357b7f6f4a3685efb3dca777",
    "rounds": [
      "Hypercerts Ecosystem Round"
    ]
  },
  {
    "chainId": 42161,
    "name": "Climate Coordination Network",
    "description": "We’re on a mission to accelerate blockchain-enabled climate solutions on a global scale, catalyzing diverse forms of climate action in order to create a sustainable and equitable future for all. Through strategic grant distribution coupled with support, we empower climate projects that are dedicated to reducing greenhouse gas emissions and serving as essential core infrastructure for web3 climate solutions.",
    "imageURL": "",
    "slug": "climate-coordination-network-42161",
    "externalId": "0x0e1401ef075c0f5290e76ca7d227b6b6d908e961f9cb19335d06a9d6816065fc",
    "rounds": [
      "Climate Round"
    ]
  },
  {
    "chainId": 42161,
    "name": "OpenCivics Grant Program",
    "description": "This OpenCivics Consortium Round seeks to fund critical collaborative protocols, prototypes, and infrastructures that enable civic engagement and interoperable civic utilities for direct governance and stewardship of our communities and commons. We see these collaborative methods and prototypes as critically underfunded force multipliers for multi-agent coordination on key systemic leverage points that create deep social change. \n\nIdeal applicants will be engaged in developing technology, applied research, and social processes related to collaboration and coordination for collective action. Projects may address the diverse stack of collaborative protocols needed for successful multi-agent coordination such as: identity and attestation, on-chain delegation and roles, decentralized project management, fundraising and allocation, systems-aware strategic alignment processes, measurement and evaluation, and participatory governance and learning. These efforts may be theoretical and research-based or may be applied contexts of collaboration whose successful actualization could lead to protocolization of key activities and collaborative functions.  \n\nFor additional definitions and application details, please visit https://go.opencivics.co/wiki",
    "imageURL": "",
    "slug": "opencivics-grant-program-42161",
    "externalId": "0x0235ce19844c454f36f7bdb6604e9df6de1be7894f5ca30a5c6f1d3cfc951a98",
    "rounds": [
      "OpenCivics Consortium Round 02"
    ]
  }
];


(async () => {
  const walletAddress = '0x5A4830885f12438E00D8f4d98e9Fe083e707698C';

  const networks = {
    42161: {
      name: 'arbitrum',
      key: 'okcKBSKXvLuSCbas6QWGvKuh-IcHHSOr'
    },
    10: {
      name: 'optimism',
      key: 'fx2SlVDrPbXwPMQT4v0lRT1PABA16Myl'
    }
  }


  // group the communities by the chainId you can use loadash to do this
  const communitiesByChainId = communities.reduce((acc, community) => {
    if (!acc[community.chainId]) {
      acc[community.chainId] = [];
    }
    acc[community.chainId].push(community);
    return acc;
  }, {} as any);

  const failed:any[] = [];

  for (const chain of Object.keys(communitiesByChainId)) {
    const web3 = new ethers.AlchemyProvider(networks[chain].name, networks[chain].key);
    const wallet = new ethers.Wallet('PRIVATE_KEY', web3 as any);
    
    const gap = new GAP({
      network: networks[chain].name,
      apiClient: new GapIndexerClient('https://gapapi.karmahq.xyz'),
      remoteStorage: new IpfsStorage(
        {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGVkMjAzYTRFODc3ZjFlQTk2MzkzY2M5YjhDNUU4NUUxM2U5OWI5NzEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTcwMDUxNTIzOTg5MSwibmFtZSI6IkdBUF9URVNUIn0.QwVmWPOXeDKCtWGFaLxGdllv-te1pKc4Jrj7rYlMdFk',
        },
        {
          url: 'https://gapapi.karmahq.xyz/ipfs',
          responseParser: (response: any) => response.cid,
        }
      ),
    });

    for (const community of communitiesByChainId[chain]){
      try{
        const newCommunity = new Community({
          data: {
            community: true,
          },
          schema: gap.findSchema('Community'),
          refUID: nullRef,
          recipient: walletAddress,
          uid: nullRef
        });

      await newCommunity.attest(wallet as any, {
        name: community.name,
        description: community.description || '',
        imageURL: community.imageURL || '',
        slug: community.slug,
        externalId: community.externalId,
      });
      }catch(error){
        failed.push(community);
      }
    }
  };
  fs.writeFileSync('failed.json', JSON.stringify(failed, null, 2));
})()
