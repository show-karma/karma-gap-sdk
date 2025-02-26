export interface ChainConfig {
  [key: string]: number;
}

export type LinkType = "website" | "twitter" | "github";

export interface Link {
  type: LinkType;
  url: string;
}

export interface Tag {
  name: string;
}

export interface ProjectData {
  description: string;
  imageURL: string;
  title: string;
  links: Link[];
  tags?: Tag[];
  slug?: string;
}

export interface GrantData {
  proposalURL: string;
  title: string;
  description: string;
  amount: string;
  payoutAddress: string;
  cycle?: string;
  season?: string;
}

export interface GrantUpdateData {
  text: string;
  type: string;
  title: string;
}
