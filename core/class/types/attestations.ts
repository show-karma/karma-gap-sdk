import { Hex } from "viem";
import { Attestation } from "../Attestation";
import { TExternalLink } from "core/types";

/** Attestation interfaces */
export class ExternalLink extends Attestation {
  url: string;
  type: TExternalLink;
}

export class GranteeDetails extends Attestation {
  name: string;
  description?: string;
  ownerAddress: Hex;
  payoutAddress: Hex;
}

export class GrantDetails extends Attestation {
  title: string;
  amount: string = "0";
  proposalURL: string;
  asset?: [Hex, bigint];
  description?: string;
}

export class GrantRound extends Attestation {
  name: string;
}

export class GrantVerified extends Attestation {
  verified: boolean;
}

export class Grant extends Attestation {
  details?: GrantDetails;
  verified?: boolean;
  round?: GrantRound;
  milestones: Milestone[] = [];
}

export class MemberDetails extends Attestation {
  name: string;
  profilePictureURL: string;
}

export class MemberOf extends Attestation {
  details?: MemberDetails;
}

export class Milestone extends Attestation<Milestone> {
  title: string;
  startsAt: number;
  endsAt: number;
  description: string;
  completed: boolean;
  approved: boolean;
}

export class MilestoneCompleted extends Attestation {}
export class MilestoneApproved extends Attestation {}

export class Tag extends Attestation {
  name: string;
}

export class ProjectDetails extends Attestation {
  title: string;
  description: string;
  imageURL: string;
  links: ExternalLink[] = [];
}
export class Project extends Attestation {
  details?: ProjectDetails;
  members: MemberOf[] = [];
  grants: Grant[];
  grantee: Grantee;
  tags: Tag[] = [];
}

export class Grantee extends Attestation {
  details?: GranteeDetails;
  projects: Project[] = [];
}
