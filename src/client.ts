import { IntegrationExecutionContext, IntegrationValidationError } from '@jupiterone/integration-sdk-core';

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
  bitbucket: BitbucketClient;
  actionsBitbucket: BitbucketClient;
  constructor(
    readonly config: IntegrationConfig,
    context: IntegrationExecutionContext,
  ) {
    let defaultBitbucket;
    let actionsBitbucket;
      try {
        [defaultBitbucket, actionsBitbucket] = bitbucketClientsFromConfig(
        context,
        config,
      );
      this.bitbucket = defaultBitbucket;
      this.actionsBitbucket = actionsBitbucket;
      } catch (err) {
        throw new IntegrationValidationError(
          'Could not validate the config and get Bitbucket clients'
        );
      }
  }

  public async verifyAuthentication(): Promise<void> {
    await this.bitbucket.authenticate(); //failure errors provided by client
  }

  /**
   * Iterates each Bitbucket workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateWorkspaces(
    iteratee: ResourceIteratee<BitbucketWorkspace>,
  ): Promise<void> {
    const names = this.config.workspace.split(",");
    let workspaces: BitbucketWorkspace[];
    if (names) {
      workspaces = await Promise.all(
        names.map((name) => {
          return this.bitbucket.getWorkspace(name);
        }),
      );
    } else {
      //this code was in the original, but it will never execute
      //at least not while config.workspace is mandatory in config.ts
      //also it returns no objects from our dev acct, so perhaps is not a valid API call?
      workspaces = await this.bitbucket.getAllWorkspaces();
    }

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
    const users: BitbucketUser[] = await this.bitbucket.getAllWorkspaceMembers(
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
    const projects: BitbucketProject[] = await this.bitbucket.getAllProjects(
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
    const repos: BitbucketRepo[] = await this.bitbucket.getAllRepos(
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
    const pullRequests: BitbucketPR[] = await this.bitbucket.getAllPRs(
      workspaceUuid,
      repoUuid,
      requestFilter,
    );

    for (const pr of pullRequests) {
      await iteratee(pr);
    }
  }
}

export function createAPIClient(
  config: IntegrationConfig,
  context: IntegrationExecutionContext,
): APIClient {
  return new APIClient(config, context);
}

function bitbucketClientsFromConfig(
  context: IntegrationExecutionContext,
  config: IntegrationConfig,
): [BitbucketClient, BitbucketClient] {
  const oauthKeys = config.oauthKey.split(',');
  const oauthSecrets = config.oauthSecret.split(',');

  const bitbucket = new BitbucketClient(context.logger, {
    oauthKey: oauthKeys[0],
    oauthSecret: oauthSecrets[0],
  });

  let actionsBitbucket;
  if (oauthKeys.length > 1 && oauthSecrets.length > 1) {
    actionsBitbucket = new BitbucketClient(context.logger, {
      oauthKey: oauthKeys[1],
      oauthSecret: oauthSecrets[1],
    });
  } else {
    actionsBitbucket = bitbucket;
  }

  return [bitbucket, actionsBitbucket];
}
