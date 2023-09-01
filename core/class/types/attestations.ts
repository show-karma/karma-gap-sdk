import { Attestation } from "../Attestation";
import { Hex, TExternalLink } from "core/types";
import { Project } from "../entities/Project";

/** Attestation interfaces */

export interface IExternalLink {
  url: string;
  type: TExternalLink;
}
export class ExternalLink
  extends Attestation<IExternalLink>
  implements IExternalLink
{
  url: string;
  type: TExternalLink;
}

export interface ICommunityDetails {
  name: string;
  description: string;
  imageURL: string;
}

export class CommunityDetails
  extends Attestation<ICommunityDetails>
  implements ICommunityDetails
{
  name: string;
  description: string;
  imageURL: string;
  links: ExternalLink[] = [];
}

export interface IGrantDetails {
  title: string;
  amount?: string;
  proposalURL: string;
  assetAndChainId?: [Hex, number];
  payoutAddress?: Hex;
  description?: string;
  communityUID: Hex;
}
export class GrantDetails
  extends Attestation<IGrantDetails>
  implements IGrantDetails
{
  title: string;
  proposalURL: string;
  communityUID: Hex;
  payoutAddress?: Hex;
  amount?: string = "0";
  assetAndChainId?: [Hex, number];
  description?: string;
}

export interface IGrantRound {
  name: string;
}
export class GrantRound
  extends Attestation<IGrantRound>
  implements IGrantRound
{
  name: string;
}

export interface IGrantVerified {
  verified: boolean;
}
export class GrantVerified
  extends Attestation<IGrantVerified>
  implements IGrantVerified
{
  verified: boolean;
}

export interface IMemberDetails {
  name: string;
  profilePictureURL: string;
}
export class MemberDetails
  extends Attestation<IMemberDetails>
  implements IMemberDetails
{
  name: string;
  profilePictureURL: string;
}

export interface IMilestoneCompleted {
  type: "approved" | "rejected" | "completed";
  reason?: string;
}
export class MilestoneCompleted
  extends Attestation<IMilestoneCompleted>
  implements IMilestoneCompleted
{
  type: "approved" | "rejected" | "completed";
  reason?: string;
}

export interface ITag {
  name: string;
}
export class Tag extends Attestation<ITag> implements ITag {
  name: string;
}

export interface IProjectDetails {
  title: string;
  description: string;
  imageURL: string;
}
export class ProjectDetails
  extends Attestation<IProjectDetails>
  implements IProjectDetails
{
  title: string;
  description: string;
  imageURL: string;
  links: ExternalLink[] = [];
}

export class Grantee {
  address: string;
  projects: Project[] = [];

  constructor(address: Hex, projects: Project[] = []) {
    this.address = address;
    this.projects = projects;
  }
}
