import { Attestation, AttestationArgs } from "../Attestation";
import { Hex, SignerOrProvider, TExternalLink } from "core/types";
import { Project } from "../entities/Project";
import { GapSchema } from "../GapSchema";
import { GrantUpdate } from "../entities/GrantUpdate";
import { nullRef } from "core/consts";
import { AttestationError } from "../SchemaError";

/** Attestation interfaces */

export type ExternalLink = { type: string; url: string }[];

export interface ICommunityDetails {
  name: string;
  description: string;
  imageURL: string;
  slug?: string;
  links?: ExternalLink;
  type?: string;
  externalId?: string;
}

export class CommunityDetails
  extends Attestation<ICommunityDetails>
  implements ICommunityDetails
{
  name: string;
  description: string;
  imageURL: string;
  links: ExternalLink = [];
  slug?: string;
  type = "community-details";
  externalId?: string;
}

export interface IGrantDetails {
  title: string;
  amount?: string;
  proposalURL: string;
  assetAndChainId?: [Hex, number];
  payoutAddress?: Hex;
  description?: string;
  // communityUID: Hex;
  season?: string;
  cycle?: string;
  questions?: IGrantDetailsQuestion[];
  type?: string;
  startDate?: number;
}
export class GrantDetails
  extends Attestation<IGrantDetails>
  implements IGrantDetails
{
  title: string;
  proposalURL: string;
  // communityUID: Hex;
  payoutAddress?: Hex;
  amount?: string;
  assetAndChainId?: [Hex, number];
  description?: string;
  season?: string;
  cycle?: string;
  questions?: IGrantDetailsQuestion[];
  type = "grant-details";
  startDate?: number;
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
  type?: "approved" | "rejected" | "completed" | "verified";
  reason?: string;
}
export class MilestoneCompleted
  extends Attestation<IMilestoneCompleted>
  implements IMilestoneCompleted
{
  type: "approved" | "rejected" | "completed" | "verified";
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
  problem?: string;
  solution?: string;
  missionSummary?: string;
  locationOfImpact?: string;
  imageURL: string;
  links?: ExternalLink;
  tags?: ITag[];
  externalIds?: string[];
  slug?: string;
  type?: string;
  businessModel?: string;
  stageIn?: string;
  raisedMoney?: string;
  pathToTake?: string;
}
export class ProjectDetails
  extends Attestation<IProjectDetails>
  implements IProjectDetails
{
  title: string;
  description: string;
  problem?: string;
  solution?: string;
  missionSummary?: string;
  locationOfImpact?: string;
  imageURL: string;
  links: ExternalLink = [];
  tags: ITag[] = [];
  slug: string;
  type = "project-details";
  externalIds: string[] = [];
  businessModel?: string;
  stageIn?: string;
  raisedMoney?: string;
  pathToTake?: string;
}

export class Grantee {
  address: string;
  projects: Project[] = [];

  constructor(address: Hex, projects: Project[] = []) {
    this.address = address;
    this.projects = projects;
  }
}

export class GrantCompleted extends GrantUpdate {}

export interface IGrantDetailsQuestion {
  query: string;
  explanation: string;
  type: string;
}

export interface IProjectEndorsement {
  comment?: string;
  type?: string;
}

export class ProjectEndorsement
  extends Attestation<IProjectEndorsement>
  implements IProjectEndorsement
{
  comment?: string;
  type?: string;

  constructor(data: AttestationArgs<IProjectEndorsement, GapSchema>) {
    (data.data as any).type = "project-endorsement";
    super(data);
  }
}
