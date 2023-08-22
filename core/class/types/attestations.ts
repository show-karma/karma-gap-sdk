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

export interface IGranteeDetails {
  name: string;
  description?: string;
  ownerAddress: Hex;
  payoutAddress: Hex;
}
export class GranteeDetails
  extends Attestation<IGranteeDetails>
  implements IGranteeDetails
{
  name: string;
  description?: string;
  ownerAddress: Hex;
  payoutAddress: Hex;
}

export interface IGrantDetails {
  title: string;
  amount: string;
  proposalURL: string;
  asset?: [Hex, bigint];
  description?: string;
}
export class GrantDetails
  extends Attestation<IGrantDetails>
  implements IGrantDetails
{
  title: string;
  amount: string = "0";
  proposalURL: string;
  asset?: [Hex, bigint];
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

export interface IGrant {
  grant: true;
}
export class Grant extends Attestation<IGrant> {
  details?: GrantDetails;
  verified?: boolean;
  round?: GrantRound;
  milestones: Milestone[] = [];
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

export interface IMemberOf {
  memberOf: true;
}
export class MemberOf extends Attestation<IMemberOf> {
  details?: MemberDetails;
}

export interface IMilestone {
  title: string;
  startsAt: number;
  endsAt: number;
  description: string;
}
export class Milestone extends Attestation<IMilestone> implements IMilestone {
  title: string;
  startsAt: number;
  endsAt: number;
  description: string;
  completed: boolean;
  approved: boolean;
}

export interface IMilestoneCompleted {
  completed: boolean;
}
export class MilestoneCompleted extends Attestation<IMilestoneCompleted> {}

export interface IMilestoneApproved {
  approved: boolean;
}
export class MilestoneApproved extends Attestation<IMilestoneApproved> {}

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

export interface IGrantee {
  grantee: true;
}
export class Grantee extends Attestation<IGrantee> {
  details?: GranteeDetails;
  projects: Project[] = [];
}
