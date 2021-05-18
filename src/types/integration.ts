import {
  IntegrationExecutionContext,
  IntegrationInstance,
} from '@jupiterone/integration-sdk-core';
import BitbucketClient from '../clients/BitbucketClient';
import {
  BitbucketProjectEntity,
  BitbucketProjectRepoRelationship,
  BitbucketPullRequestEntity,
  BitbucketRepoEntity,
  BitbucketRepoPullRequestRelationship,
  BitbucketUserEntity,
  BitbucketUserPullRequestRelationship,
  BitbucketWorkspaceEntity,
  BitbucketWorkspaceProjectRelationship,
  BitbucketWorkspaceRepoRelationship,
  BitbucketWorkspaceUserRelationship,
} from './';

export interface BitbucketExecutionContext extends IntegrationExecutionContext {
  bitbucket: BitbucketClient;
  actionsBitbucket: BitbucketClient;
}

/**
 * The `IntegrationInstance.config` structure used by this integration.
 *
 * JupiterOne accounts may configure a number of instances of an integration,
 * each containing credentials and other information necessary for the
 * integration to connect to provider APIs. An integration is triggered by an
 * event containing the instance configuration. `IntegrationInstance.config` is
 * encrypted at rest and decrypted before it is delivered to the integration
 * execution handler.
 */
export interface BitbucketIntegrationConfig {
  oauthKey: string;
  oauthSecret: string;
  ingestPullRequests: boolean;

  /**
   * TODO: Rename to workspaces, need to manage migration of existing
   * configurations.
   */
  teams?: string[];
}

export interface BitbucketIntegrationInstance extends IntegrationInstance {
  config: BitbucketIntegrationConfig;
}

export interface GraphData {
  workspaces: BitbucketWorkspaceEntity[];
  users: BitbucketUserEntity[];
  repos: BitbucketRepoEntity[];
  projects: BitbucketProjectEntity[];
  pullRequests: BitbucketPullRequestEntity[];

  workspaceUserRelationships: BitbucketWorkspaceUserRelationship[];
  workspaceRepoRelationships: BitbucketWorkspaceRepoRelationship[];
  workspaceProjectRelationships: BitbucketWorkspaceProjectRelationship[];
  projectRepoRelationships: BitbucketProjectRepoRelationship[];
  repoPRRelationships: BitbucketRepoPullRequestRelationship[];
  userPRRelationships: BitbucketUserPullRequestRelationship[];
}

export function initializeGraphData(): GraphData {
  return {
    workspaces: [],
    users: [],
    repos: [],
    projects: [],
    pullRequests: [],

    workspaceUserRelationships: [],
    workspaceRepoRelationships: [],
    workspaceProjectRelationships: [],
    projectRepoRelationships: [],
    repoPRRelationships: [],
    userPRRelationships: [],
  };
}

export interface ProviderData extends GraphData {
  userByIdMap: IdEntityMap<BitbucketUserEntity>;
  repoByIdMap: IdEntityMap<BitbucketRepoEntity>;
  reposByWorkspaceMap: IdEntityMap<BitbucketRepoEntity[]>;
  pullRequestByIdMap: IdEntityMap<BitbucketPullRequestEntity>;
  projectByIdMap: IdEntityMap<BitbucketProjectEntity>;
  usersByWorkspaceMap: IdEntityMap<BitbucketUserEntity[]>;
}

export function initializeProviderData(): ProviderData {
  return {
    workspaces: [],
    users: [],
    repos: [],
    projects: [],
    pullRequests: [],

    workspaceUserRelationships: [],
    workspaceRepoRelationships: [],
    workspaceProjectRelationships: [],
    projectRepoRelationships: [],
    repoPRRelationships: [],
    userPRRelationships: [],

    userByIdMap: {},
    repoByIdMap: {},
    reposByWorkspaceMap: {},
    pullRequestByIdMap: {},
    projectByIdMap: {},
    usersByWorkspaceMap: {},
  };
}

export interface IdEntityMap<V> {
  [key: string]: V;
}
