import { Attestation } from '../Attestation';
import { gqlQueries } from '../../utils/gql-queries';
import { toUnix } from '../../utils/to-unix';
import {
  AttestationRes,
  AttestationsRes,
  EASNetworkConfig,
  Hex,
  IAttestation,
  SchemaRes,
  SchemataRes,
  TNetwork,
  TSchemaName,
} from '../../types';
import {
  CommunityDetails,
  GrantDetails,
  GrantUpdate,
  Grantee,
  MemberDetails,
  MilestoneCompleted,
  ProjectDetails,
} from '../types/attestations';
import { GapSchema } from '../GapSchema';
import { Schema } from '../Schema';
import { SchemaError } from '../SchemaError';
import { Grant, Milestone, IProject, Project, MemberOf } from '../entities';
import { Community } from '../entities/Community';
import { mapFilter } from '../../utils';
import { Fetcher } from '../Fetcher';
import { Networks } from '../../consts';

interface EASClientProps {
  network: TNetwork;
}

// TODO: Split this class into small ones
export class GapEasClient extends Fetcher {
  network: EASNetworkConfig & { name: TNetwork };

  constructor(args: EASClientProps) {
    const { network } = args;
    super(Networks[network].url);

    this.network = { ...Networks[network], name: network };
  }

  /**
   * Fetches all the schemas deployed by an owner
   * @param owner
   */
  async schemas(owner: Hex): Promise<GapSchema[]> {
    const query = gqlQueries.schemata(owner);
    const { schemata } = await this.query<SchemataRes>(query);

    return schemata.map(
      (schema) =>
        new GapSchema({
          name: '',
          schema: Schema.rawToObject(schema.schema),
          uid: schema.uid,
        })
    );
  }

  async attestation<T = unknown>(uid: Hex) {
    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);

    return Attestation.fromInterface<Attestation<T>>([attestation])[0];
  }

  async attestations(
    schemaName: TSchemaName,
    search?: string
  ): Promise<IAttestation[]> {
    const schema = GapSchema.find(schemaName);

    const query = gqlQueries.attestationsOf(schema.uid, search);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations;
  }

  async attestationsOf(
    schemaName: TSchemaName,
    recipient: Hex
  ): Promise<IAttestation[]> {
    const schema = GapSchema.find(schemaName);
    const query = gqlQueries.attestationsOf(schema.uid, recipient);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations;
  }

  async attestationsTo(
    schemaName: TSchemaName,
    recipient: Hex
  ): Promise<IAttestation[]> {
    const schema = GapSchema.find(schemaName);
    const query = gqlQueries.attestationsTo(schema.uid, recipient);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations;
  }

  /**
   * Fetch all dependent attestations of a parent schema.
   * @param parentSchema the schema name to get dependents of.
   * @param parentUid the parent uid to get dependents of.
   */
  async dependentsOf(
    parentSchema: TSchemaName,
    parentUid: Hex
  ): Promise<Attestation[]> {
    const parent = GapSchema.find(parentSchema);
    const children = parent.children.map((c) => c.uid);

    if (!children.length)
      throw new SchemaError(
        'INVALID_REFERENCE',
        `Schema ${parentSchema} has no children.`
      );

    const query = gqlQueries.dependentsOf(parentUid, children);
    const { attestations } = await this.query<AttestationsRes>(query);

    return Attestation.fromInterface(attestations);
  }

  async communities(search?: string) {
    const [community, communityDetails] = GapSchema.findMany([
      'Community',
      'CommunityDetails',
    ]);

    const query = gqlQueries.attestationsOf(community.uid, search);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const communities = Attestation.fromInterface<Community>(attestations);

    if (!communities.length) return [];

    return this.communitiesDetails(communities);
  }

  async communitiesOf(address?: Hex) {
    const [community] = GapSchema.findMany(['Community']);

    const query = gqlQueries.attestationsTo(community.uid, address);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const communities = Attestation.fromInterface<Community>(attestations);

    if (!communities.length) return [];

    return this.communitiesDetails(communities);
  }

  async communitiesByIds(uids: Hex[]) {
    if (!uids.length) return [];
    const communityDetails = GapSchema.find('CommunityDetails');

    const communityQuery = gqlQueries.attestationsIn(uids);
    const detailsQuery = gqlQueries.dependentsOf(uids, [communityDetails.uid]);
    try {
      const [communities, details] = await Promise.all([
        this.query<AttestationsRes>(communityQuery),
        this.query<AttestationsRes>(detailsQuery),
      ]);

      const communitiesAttestations = Attestation.fromInterface<Community>(
        communities.attestations || []
      );

      const detailsAttestations = Attestation.fromInterface<CommunityDetails>(
        details.attestations || []
      );

      communitiesAttestations.forEach((community) => {
        community.details = detailsAttestations.find(
          (d) => d.refUID === community.uid
        );
      });

      return communitiesAttestations;
    } catch (error) {
      throw error;
    }
  }

  async communitiesDetails(communities: Community[]) {
    const [project, communityDetails] = GapSchema.findMany([
      'Project',
      'CommunityDetails',
    ]);

    const ref = gqlQueries.dependentsOf(
      communities.map((c) => c.uid),
      [communityDetails.uid]
    );

    const results = await this.query<AttestationsRes>(ref);
    const deps = Attestation.fromInterface(results.attestations || []);

    return communities.map((community) => {
      community.projects = <Project[]>(
        deps.filter(
          (ref) =>
            ref.schema.uid === project.uid && ref.refUID === community.uid
        )
      );

      community.details = <CommunityDetails>(
        deps.find(
          (ref) =>
            ref.schema.uid === communityDetails.uid &&
            ref.refUID === community.uid
        )
      );

      return community;
    });
  }

  async communityBySlug(slug: string) {
    const communitySchema = GapSchema.find('CommunityDetails');

    const query = gqlQueries.attestationsOf(
      communitySchema.uid,
      this.getSearchFieldString('slug', slug)
    );

    try {
      const {
        schema: { attestations },
      } = await this.query<SchemaRes>(query);

      if (!attestations.length) throw new Error('Community not found.');

      const communities = mapFilter(
        Attestation.fromInterface<CommunityDetails>(attestations),
        (details) => !!details.name,
        (details) => {
          const community = new Community({
            data: { community: true },
            uid: details.refUID,
            schema: communitySchema,
            recipient: details.recipient,
          });

          community.details = details;
          return community;
        }
      );

      const [withDetails] = await this.communitiesDetails(communities);

      if (!withDetails) throw new Error('Community not found.');

      const grants = await this.grantsByCommunity(withDetails.uid);
      withDetails.grants = grants;

      return withDetails;
    } catch (error) {
      throw error;
    }
  }

  async communityById(uid: Hex) {
    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);

    if (!attestation) throw new Error('Community not found.');

    const communities = Attestation.fromInterface<Community>([attestation]).map(
      (c) => new Community(c)
    );

    const [withDetails] = await this.communitiesDetails(communities);
    if (!withDetails) throw new Error('Community not found.');
    const grants = await this.grantsByCommunity(uid);
    withDetails.grants = grants;
    return withDetails;
  }

  /**
   * Fetch the details for a set of
   * projects with project grants,
   * members, milestones, and tags.
   * @param projects
   */
  async projectsDetails(projects: Project[]) {
    // Get projects array and fetch details, members, grants, etc then append to the project and return the array.

    const [projectDetails] = GapSchema.findMany(['ProjectDetails']);

    const refQuery = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [projectDetails.uid]
    );

    const [result, members, grants] = await Promise.all([
      this.query<AttestationsRes>(refQuery),
      this.membersOf(projects),
      this.grantsFor(projects, true),
    ]);

    const deps = Attestation.fromInterface(result.attestations || []);

    return projects.map((project) => {
      project.details = <ProjectDetails>(
        deps.find(
          (ref) =>
            ref.schema.uid === projectDetails.uid && ref.refUID === project.uid
        )
      );

      project.members = members.filter((m) => m.refUID === project.uid);

      project.grants = grants.filter((g) => g.refUID === project.uid);

      return project;
    });
  }

  async projectById(uid: Hex) {
    const query = gqlQueries.attestation(uid);
    const { attestation } = await this.query<AttestationRes>(query);

    if (!attestation) throw new Error('Project not found.');

    const projectAttestation = Attestation.fromInterface<Project>([
      attestation,
    ])[0];

    const [result] = await this.projectsDetails([
      new Project(projectAttestation),
    ]);

    return result;
  }

  async projectBySlug(slug: string) {
    const projectDetails = GapSchema.find('ProjectDetails');

    const query = gqlQueries.attestationsOf(
      projectDetails.uid,
      this.getSearchFieldString('slug', slug)
    );

    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const projectAttestations = Attestation.fromInterface<ProjectDetails>(
      attestations
    ).filter((p) => p.title);

    if (!projectAttestations.length) throw new Error('Project not found.');

    const project = new Project({
      data: { project: true },
      uid: projectAttestations[0].refUID,
      schema: GapSchema.find('Project'),
      recipient: projectAttestations[0].recipient,
    });
    const [withDetails] = await this.projectsDetails([project]);

    if (!withDetails) throw new Error('Project not found.');

    return withDetails;
  }

  async slugExists(slug: string) {
    const details = GapSchema.find('ProjectDetails');

    const query = gqlQueries.attestationsOf(details.uid, 'slug');
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    return attestations.some((a) => a.decodedDataJson.includes(slug));
  }

  async projects(name?: string): Promise<Project[]> {
    const result = await this.attestations('Project', name);

    if (!result.length) return [];
    const projects = Attestation.fromInterface<Project>(result);
    return this.projectsDetails(projects);
  }

  async projectsOf(grantee: Hex): Promise<Project[]> {
    const result = await this.attestationsTo('Project', grantee);

    if (!result.length) return [];
    const projects = Attestation.fromInterface<Project>(result);
    return this.projectsDetails(projects);
  }

  async grantee(address: Hex): Promise<Grantee> {
    const projects = await this.projectsOf(address);

    return new Grantee(address, projects);
  }

  async grantees(): Promise<Grantee[]> {
    const projects = await this.projects();

    return projects.reduce(
      (acc, item) => {
        const hasGrantee = acc.find((g) => g.address === item.recipient);

        if (hasGrantee) hasGrantee.projects.push(item);
        else acc.push(new Grantee(item.recipient, [item]));
        return acc;
      },
      <Grantee[]>[]
    );
  }

  async grantsOf(grantee: Hex, withCommunity?: boolean): Promise<Grant[]> {
    const [grant, grantDetails, grantVerified] = GapSchema.findMany([
      'Grant',
      'GrantDetails',
      'GrantVerified',
    ]);

    const query = gqlQueries.attestationsTo(grant.uid, grantee);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const grants = Attestation.fromInterface<Grant>(attestations);

    if (!grants.length) return [];

    const ref = gqlQueries.dependentsOf(
      grants.map((g) => g.uid),
      [grantDetails.uid, grantVerified.uid],
      grants.map((g) => g.recipient)
    );

    const results = await this.query<AttestationsRes>(ref);
    const deps = Attestation.fromInterface(results.attestations || []);

    const milestones = await this.milestonesOf(grants);
    const communities = withCommunity
      ? await this.communitiesByIds(
          mapFilter(
            grants,
            (g) => !!g.communityUID,
            (g) => g.communityUID
          )
        )
      : [];

    const withDetails = grants.map((grant) => {
      const refs = deps.filter((ref) => ref.refUID === grant.uid);

      grant.verified = !!refs.find(
        (ref) =>
          ref.schema.uid === grantVerified.uid && ref.refUID === grant.uid
      );

      grant.details = <GrantDetails>(
        refs.find(
          (ref) =>
            ref.schema.uid === grantDetails.uid &&
            ref.refUID === grant.uid &&
            typeof (ref as Milestone).endsAt === 'undefined'
        )
      );

      grant.milestones = milestones.filter(
        (m) => m.refUID === grant.uid && typeof m.endsAt !== 'undefined'
      );

      grant.community = communities.find((c) => c.uid === grant.communityUID);

      return grant;
    });

    return this.grantsUpdates(withDetails);
  }

  async grantsUpdates(grants: Grant[]) {
    const details = GapSchema.find('GrantDetails');

    const query = gqlQueries.attestationsOf(
      details.uid,
      this.getSearchFieldString('type', 'grant-update'),
      grants.map((g) => g.uid)
    );

    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const updates = Attestation.fromInterface<GrantUpdate>(attestations);

    return grants.map((grant) => {
      grant.updates = updates.filter((u) => u.refUID === grant.uid);
      return grant;
    });
  }

  async grantsByCommunity(uid: Hex) {
    const [grant, grantDetails, project, projectDetails] = GapSchema.findMany([
      'Grant',
      'GrantDetails',
      'Project',
      'ProjectDetails',
    ]);

    const query = gqlQueries.attestations(grant.uid, uid);
    const {
      schema: { attestations },
    } = await this.query<SchemaRes>(query);

    const grants = Attestation.fromInterface<Grant>(attestations).map(
      (g) => new Grant(g)
    );

    if (!grants.length) return [];

    const refs = gqlQueries.dependentsOf(
      grants.map((g) => [g.uid, g.refUID]).flat(),
      [grantDetails.uid, project.uid]
    );

    const results = await this.query<AttestationsRes>(refs);

    const deps = Attestation.fromInterface(results.attestations || []);

    const projectsQuery = gqlQueries.attestationsIn(
      grants.map((g) => g.refUID)
    );

    const { attestations: projectAttestations } =
      await this.query<AttestationsRes>(projectsQuery);

    const projects = Attestation.fromInterface<Project>(projectAttestations);

    const milestones = await this.milestonesOf(grants);

    return grants
      .map((grant) => {
        grant.project = <Project>projects.find((p) => p.uid === grant.refUID);

        grant.details = <GrantDetails>(
          deps.find(
            (d) =>
              d.refUID === grant.uid &&
              d.schema.uid === grantDetails.uid &&
              typeof (d as GrantDetails).amount !== undefined &&
              typeof (d as Milestone).endsAt === 'undefined' &&
              typeof (d as GrantUpdate).data.type === 'undefined'
          )
        );

        grant.milestones = milestones
          .filter(
            (m) => m.refUID === grant.uid && typeof m.endsAt !== 'undefined'
          )
          .sort((a, b) => a.endsAt - b.endsAt);

        grant.updates = deps.filter(
          (d: GrantUpdate) => d.data.type && d.refUID === grant.uid
        ) as GrantUpdate[];

        return grant;
      })
      .filter((g) => !!g.project);
  }

  async grantsFor(
    projects: Project[],
    withCommunity?: boolean
  ): Promise<Grant[]> {
    const [grant, grantDetails] = GapSchema.findMany([
      'Grant',
      'GrantDetails',
      'Milestone',
      'MilestoneApproved',
      'MilestoneCompleted',
    ]);

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [grant.uid]
    );

    const { attestations: grants } = await this.query<AttestationsRes>(query);

    const grantsWithDetails = Attestation.fromInterface<Grant>(grants).map(
      (g) => new Grant(g)
    );

    const ref = gqlQueries.dependentsOf(
      grants.map((g) => g.uid),
      [grantDetails.uid]
    );

    const { attestations } = await this.query<AttestationsRes>(ref);

    const milestones = await this.milestonesOf(grantsWithDetails);

    const deps = Attestation.fromInterface(attestations);

    // TODO unify this with grantsOf
    grantsWithDetails.forEach((grant) => {
      grant.details = <GrantDetails>(
        deps.find(
          (d) =>
            d.refUID === grant.uid &&
            d.schema.uid === grantDetails.uid &&
            typeof (d as GrantDetails).amount !== undefined &&
            typeof (d as Milestone).endsAt === 'undefined' &&
            typeof (d as GrantUpdate).data.type === 'undefined'
        )
      );
      grant.milestones = milestones
        .filter(
          (m) => m.refUID === grant.uid && typeof m.endsAt !== 'undefined'
        )
        .sort((a, b) => a.endsAt - b.endsAt);
    });

    const communities = withCommunity
      ? await this.communitiesByIds(
          mapFilter(
            grantsWithDetails,
            (g) => !!g.communityUID,
            (g) => g.communityUID
          )
        )
      : [];

    grantsWithDetails.forEach((grant) => {
      grant.community = communities.find((c) => c.uid === grant.communityUID);
    });

    const grantsWithUpdates = await this.grantsUpdates(grantsWithDetails);

    return grantsWithUpdates.sort(
      (a, b) =>
        a.milestones?.at(-1)?.endsAt - b.milestones?.at(-1)?.endsAt ||
        a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async milestonesOf(grants: Grant[]): Promise<Milestone[]> {
    const [milestone, milestoneApproved, milestoneCompleted] =
      GapSchema.findMany([
        'Milestone',
        'MilestoneApproved',
        'MilestoneCompleted',
      ]);

    const query = gqlQueries.dependentsOf(
      grants.map((g) => g.uid),
      [milestone.uid]
    );

    const { attestations } = await this.query<AttestationsRes>(query);

    const milestones = Attestation.fromInterface<Milestone>(attestations)
      .map((milestone) => new Milestone(milestone))
      .filter((m) => typeof m.endsAt !== 'undefined');

    if (!milestones.length) return [];

    const ref = gqlQueries.dependentsOf(
      milestones.map((m) => m.uid),
      [milestoneApproved.uid, milestoneCompleted.uid]
    );

    const results = await this.query<AttestationsRes>(ref);

    const deps = Attestation.fromInterface<MilestoneCompleted>(
      results.attestations || []
    );

    return milestones.map((milestone) => {
      const refs = deps.filter((ref) => ref.refUID === milestone.uid);

      milestone.endsAt = toUnix(milestone.endsAt);

      milestone.completed = refs.find(
        (dep) => dep.type === 'completed' && dep.refUID === milestone.uid
      );

      milestone.approved = refs.find(
        (dep) => dep.type === 'approved' && dep.refUID === milestone.uid
      );

      milestone.rejected = refs.find(
        (dep) => dep.type === 'rejected' && dep.refUID === milestone.uid
      );

      return milestone;
    });
  }

  async membersOf(projects: Project[]): Promise<MemberOf[]> {
    const [member, memberDetails] = GapSchema.findMany([
      'MemberOf',
      'MemberDetails',
    ]);

    if (!projects.length) return [];

    const query = gqlQueries.dependentsOf(
      projects.map((p) => p.uid),
      [member.uid],
      projects.map((p) => p.attester)
    );

    const results = await this.query<AttestationsRes>(query);

    const members = Attestation.fromInterface<MemberOf>(
      results.attestations || []
    );

    if (members.length) {
      const ref = gqlQueries.dependentsOf(
        members.map((a) => a.uid),
        [memberDetails.uid],
        members.map((a) => a.attester)
      );

      const detailsResult = await this.query<AttestationsRes>(ref);
      const detailsRef = Attestation.fromInterface<MemberDetails>(
        detailsResult.attestations || []
      );

      members.forEach((member) => {
        member.details = detailsRef.find((d) => d.refUID === member.uid);
      });
    }

    return members;
  }

  /**
   * Returns a string to be used to search by a value in `decodedDataJson`.
   * @param field
   * @param value
   */
  private getSearchFieldString(field: string, value: string) {
    return [
      String.raw`\\\\\"${field}\\\\\":\\\\\"${value}\\\\\"`,
      String.raw`\\\\\"${field}\\\\\": \\\\\"${value}\\\\\"`,
    ];
  }

  async grantsForExtProject(projectExtId: string): Promise<Grant[]> {
    console.error(
      new Error(
        'Grants for external project is only supported by a custom indexer. Check https://github.com/show-karma/karma-gap-sdk for more information.'
      )
    );
    return [];
  }
}
