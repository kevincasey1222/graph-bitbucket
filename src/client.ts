import {
  IntegrationExecutionContext,
  IntegrationValidationError,
  IntegrationLogger,
} from '@jupiterone/integration-sdk-core';

import BitbucketClient from './clients/BitbucketClient';
import {
  BitbucketWorkspace,
  BitbucketUser,
  BitbucketProject,
  BitbucketRepo,
  BitbucketPR,
} from './types/bitbucket';
import { IntegrationConfig } from '../src/config';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  bitbucketClients: BitbucketClient[];
  currentClientPointer: number;
  constructor(
    readonly config: IntegrationConfig,
    context: IntegrationExecutionContext,
  ) {
    const oauthKeys = config.oauthKey.split(',');
    const oauthSecrets = config.oauthSecret.split(',');
    if (!(oauthKeys.length === oauthSecrets.length)) {
      throw new IntegrationValidationError(
        'Number of comma-delimited Oauth keys and secrets differ in the config',
      );
    }
    try {
      this.bitbucketClients = this.bitbucketClientsFromConfig(
        oauthKeys,
        oauthSecrets,
        context.logger,
      );
    } catch (err) {
      throw new IntegrationValidationError(
        'Could not validate the config and get Bitbucket clients',
      );
    }
    this.currentClientPointer = 0;
  }

  public async verifyAuthentication(): Promise<void> {
    await this.getCurrentClient().authenticate(); //failure errors provided by client
  }

  /**
   * Iterates each Bitbucket workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateWorkspaces(
    iteratee: ResourceIteratee<BitbucketWorkspace>,
  ): Promise<void> {
    const names = this.config.workspace;
    const workspaces: BitbucketWorkspace[] = await Promise.all(
      names.map((name) => {
        return this.bitbucket.getWorkspace(name);
      }),
    );

    for (const workspace of workspaces) {
      await iteratee(workspace);
    }
  }

  /**
   * Iterates each Bitbucket user for a given workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    workspaceSlug: string,
    iteratee: ResourceIteratee<BitbucketUser>,
  ): Promise<void> {
    const users: BitbucketUser[] = await this.getCurrentClient().getAllWorkspaceMembers(
      workspaceSlug,
    );

    for (const user of users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each Bitbucket project for a given workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateProjects(
    workspaceSlug: string,
    iteratee: ResourceIteratee<BitbucketProject>,
  ): Promise<void> {
    const projects: BitbucketProject[] = await this.getCurrentClient().getAllProjects(
      workspaceSlug,
    );

    for (const project of projects) {
      await iteratee(project);
    }
  }

  /**
   * Iterates each Bitbucket repo for a given workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateRepos(
    workspaceUuid: string,
    iteratee: ResourceIteratee<BitbucketRepo>,
  ): Promise<void> {
    const repos: BitbucketRepo[] = await this.getCurrentClient().getAllRepos(
      workspaceUuid,
    );

    for (const repo of repos) {
      await iteratee(repo);
    }
  }

  /**
   * Iterates each Bitbucket pull request for a given workspace and repo combination.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iteratePRs(
    workspaceUuid: string,
    repoUuid: string,
    requestFilter: string,
    iteratee: ResourceIteratee<BitbucketPR>,
  ): Promise<void> {
    const pullRequests: BitbucketPR[] = await this.getCurrentClient().getAllPRs(
      workspaceUuid,
      repoUuid,
      requestFilter,
    );

    //for performance reasons, getAllPRs does not provide all PR properties
    //to get all properties for a PR, you have to pull the PRs individually
    //but, that's potentially hitting the API a lot
    //properties that we know are missing in .getAllPRs are
    // `reviewers` and `participants`
    const pullPRsIndividually = false;
    for (const pr of pullRequests) {
      if (pullPRsIndividually) {
        const thePr: BitbucketPR = await this.getCurrentClient().getPR(
          workspaceUuid,
          repoUuid,
          pr.id,
        );
        await iteratee(thePr);
      } else {
        await iteratee(pr);
      }
    }
  }

  bitbucketClientsFromConfig(
    oauthKeys: string[],
    oauthSecrets: string[],
    logger: IntegrationLogger,
  ): BitbucketClient[] {
    const bitbucketClients: BitbucketClient[] = [];
    for (let i = 0; i < oauthKeys.length; i++) {
      bitbucketClients.push(
        new BitbucketClient(logger, {
          oauthKey: oauthKeys[i],
          oauthSecret: oauthSecrets[i],
        }),
      );
    }

    return bitbucketClients;
  }

  getCurrentClient(): BitbucketClient {
    return this.bitbucketClients[this.currentClientPointer];
  }
}

export function createAPIClient(
  config: IntegrationConfig,
  context: IntegrationExecutionContext,
): APIClient {
  return new APIClient(config, context);
}
