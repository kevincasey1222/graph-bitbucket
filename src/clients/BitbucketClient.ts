import {
  IntegrationError,
  IntegrationProviderAuthenticationError,
  IntegrationConfigLoadError,
  IntegrationLogger,
} from '@jupiterone/integration-sdk-core';
import fetch from 'node-fetch';
import querystring from 'querystring';
import urlJoin from 'url-join';
import {
  BitbucketCommit,
  BitbucketCommitHash,
  BitbucketPR,
  BitbucketPRActivity,
  BitbucketProject,
  BitbucketRepo,
  BitbucketUser,
  BitbucketWorkspace,
  BitbucketWorkspaceMembership,
} from '../types';

const BASE_API_URL = 'https://bitbucket.org/api/2.0/';

interface OAuthAccessTokenResponse {
  access_token: string;
}

interface BitbucketPage<T> {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: T[];
}

interface BitbucketClientOptions {
  oauthKeys: string[];
  oauthSecrets: string[];
}

interface BitbucketAPICalls {
  repositories: number;
  repository: number;
  pullRequests: number;
  pullRequest: number;
  pullRequestActivity: number;
  commits: number;
  diff: number;
  workspaceMembers: number;
  user: number;
  projects: number;
  project: number;
  workspaces: number;
  workspace: number;
}

function base64(str: string) {
  return Buffer.from(str, 'utf8').toString('base64');
}

export default class BitbucketClient {
  public calls: BitbucketAPICalls;
  private accessTokens: string[];
  private accessToken: string;

  constructor(
    readonly logger: IntegrationLogger,
    readonly config: BitbucketClientOptions,
  ) {
    this.calls = {
      repositories: 0,
      repository: 0,
      pullRequests: 0,
      pullRequest: 0,
      pullRequestActivity: 0,
      commits: 0,
      diff: 0,
      workspaceMembers: 0,
      user: 0,
      projects: 0,
      project: 0,
      workspaces: 0,
      workspace: 0,
    };
  }

  public async authenticate() {
    if (!this.config.oauthKeys || !this.config.oauthSecrets) {
      throw new Error('"oauthKey(s)" and "oauthSecret(s)" are required');
    }

    this.accessTokens = [];
    for (var i = 0; i < this.config.oauthKeys.length; i++) {
      const url = 'https://bitbucket.org/site/oauth2/access_token';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${base64(
            this.config.oauthKeys[i] + ':' + this.config.oauthSecrets[i],
          )}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: querystring.stringify({
          grant_type: 'client_credentials',
        }),
      });

      if (response.status < 200 || response.status >= 400) {
        throw new IntegrationProviderAuthenticationError({
          cause: undefined,
          endpoint: url,
          status: response.status,
          statusText: `Failure requesting '${url}' for Oauth Key ${i}. Response status: ${response.status}`,
        });
      }

      const data: OAuthAccessTokenResponse = await response.json();
      this.accessTokens.push(data.access_token);
    }

    this.accessToken = this.accessTokens[0];
  }

  async makeGetRequest<T>(
    url: string,
    options?: {
      ignoreNotFound?: boolean;
    },
  ) {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      this.logger.info(`Requesting ${url}...`);
      if (!url.startsWith('https://')) {
        url = urlJoin(BASE_API_URL, url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        timeout: 10000,
      });

      this.logger.info(`Got response for ${url} (status=${response.status})`);

      if (response.status === 404 && options?.ignoreNotFound) {
        return {
          data: undefined,
          status: response.status,
        };
      }

      //if we get a rate-limiting 429 message, go to the next access token, if there is one

      if (response.status < 200 || response.status >= 400) {
        throw new IntegrationProviderAuthenticationError({
          cause: undefined,
          endpoint: url,
          status: response.status,
          statusText: `Failure requesting '${url}'. Response status: ${response.status}`,
        });
      }

      return {
        data: await response.json(),
        status: response.status,
      };
    } catch (err) {
      throw new IntegrationError({
        message: `Failure requesting '${url}'`,
        code: JSON.stringify(err),
      });
    }
  }

  async forEachPage<T>(
    options: {
      firstUri: string;
      ignoreNotFound?: boolean;
    },
    eachFn: (page: BitbucketPage<T>) => void,
  ) {
    let nextPageUrl: string | null = options.firstUri;

    while (nextPageUrl) {
      const response = await this.makeGetRequest<BitbucketPage<T>>(
        nextPageUrl,
        options,
      );

      const page: any = response.data;

      if (page) {
        eachFn(page);
      }

      if (page?.next) {
        if (!page.next.startsWith(BASE_API_URL)) {
          throw new Error(
            `The next page URL, ${page.next}, does not start with the expected base API URL ${BASE_API_URL}`,
          );
        } else {
          nextPageUrl = page.next.substring(BASE_API_URL.length);
        }
      } else {
        nextPageUrl = null;
      }
    }
  }

  async collectAllPages<T>(
    firstUri: string,
    options?: {
      ignoreNotFound: boolean;
    },
  ): Promise<{ results: T[]; calls: number }> {
    const results: T[] = [];
    let calls = 0;

    await this.forEachPage<T>(
      {
        ...options,
        firstUri,
      },
      (page: BitbucketPage<T>) => {
        calls++;
        for (const item of page.values) {
          results.push(item);
        }
      },
    );

    return { results, calls };
  }

  async getWorkspace(workspace: string): Promise<BitbucketWorkspace> {
    const result = await this.makeGetRequest<BitbucketWorkspace>(
      `workspaces/${workspace}`,
      {
        ignoreNotFound: true,
      },
    );
    this.calls.workspace++;

    if (result.status === 404) {
      throw new IntegrationConfigLoadError(
        `Workspace '${workspace}' not found, please verify the integration configuration`,
      );
    }

    return result.data;
  }

  async getAllWorkspaces(): Promise<BitbucketWorkspace[]> {
    const { results, calls } = await this.collectAllPages<BitbucketWorkspace>(
      `workspaces`,
    );
    this.calls.workspaces += calls;
    return results;
  }

  async getRepo(workspace: string, repository: string): Promise<BitbucketRepo> {
    const result = await this.makeGetRequest<BitbucketRepo>(
      `repositories/${workspace}/${repository}`,
    );
    this.calls.repository++;
    return result.data;
  }

  async getAllRepos(workspace: string): Promise<BitbucketRepo[]> {
    const { results, calls } = await this.collectAllPages<BitbucketRepo>(
      `repositories/${workspace}`,
    );
    this.calls.repositories += calls;
    return results;
  }

  async getPR(
    workspace: string,
    repository: string,
    id: string,
  ): Promise<BitbucketPR> {
    const result = await this.makeGetRequest<BitbucketPR>(
      `repositories/${workspace}/${repository}/pullrequests/${id}`,
    );
    this.calls.pullRequest++;
    return result.data;
  }

  async getAllPRs(
    workspace: string,
    repository: string,
    filter: string,
  ): Promise<BitbucketPR[]> {
    const { results, calls } = await this.collectAllPages<BitbucketPR>(
      `repositories/${workspace}/${repository}/pullrequests?q=${encodeURI(
        filter,
      )}`,
      {
        ignoreNotFound: true,
      },
    );
    this.calls.pullRequests += calls;
    return results;
  }

  async getPRActivity(
    workspace: string,
    repository: string,
    prId: string,
  ): Promise<BitbucketPRActivity[]> {
    const { results, calls } = await this.collectAllPages<BitbucketPRActivity>(
      `repositories/${workspace}/${repository}/pullrequests/${prId}/activity`,
    );
    this.calls.pullRequestActivity += calls;
    return results;
  }

  /**
   * Get commits from a source to a destination, excluding destination. This
   * endpoint is rate limited to 1000 requests per hour, so use wisely!
   */
  async getCommits(
    workspace: string,
    repository: string,
    sourceRevision: string,
    destinationRevision: string,
  ): Promise<BitbucketCommit[]> {
    const { results, calls } = await this.collectAllPages<BitbucketCommit>(
      `repositories/${workspace}/${repository}/commits/${sourceRevision}?exclude=${destinationRevision}`,
    );
    this.calls.commits += calls;
    return results;
  }

  async getUser(uuid: string): Promise<BitbucketUser> {
    const response = await this.makeGetRequest<BitbucketUser>(`users/${uuid}`);
    this.calls.user++;
    return response.data;
  }

  async getAllWorkspaceMembers(workspace: string): Promise<BitbucketUser[]> {
    const { results, calls } = await this.collectAllPages<
      BitbucketWorkspaceMembership
    >(`workspaces/${workspace}/members`);
    this.calls.workspaceMembers += calls;
    return results.map((member) => member.user);
  }

  async getProject(
    workspace: string,
    projectKey: string,
  ): Promise<BitbucketProject> {
    const result = await this.makeGetRequest<BitbucketProject>(
      `workspaces/${workspace}/projects/${projectKey}`,
    );
    this.calls.project++;
    return result.data;
  }

  async getAllProjects(workspace: string): Promise<BitbucketProject[]> {
    const { results, calls } = await this.collectAllPages<BitbucketProject>(
      `workspaces/${workspace}/projects/`,
    );
    this.calls.projects += calls;
    return results;
  }

  async diff(
    workspace: string,
    repoName: string,
    source: BitbucketCommitHash,
    destination: BitbucketCommitHash,
  ): Promise<any> {
    const encodedWorkspace = encodeURIComponent(workspace);
    const encodedRepo = encodeURIComponent(repoName);
    const encodedRange = encodeURIComponent(`${source}..${destination}`);

    const response = await this.makeGetRequest(
      `repositories/${encodedWorkspace}/${encodedRepo}/diff/${encodedRange}`,
    );

    this.calls.diff += 1;
    return response.data;
  }

  async isEmptyMergeCommit(
    workspace: string,
    repoName: string,
    commit: BitbucketCommit,
  ): Promise<boolean> {
    if (commit.parents.length !== 2) {
      return false;
    }

    // Check to see if this is a simple merge where there were no parallel changes
    // in master since the branch being merged was created
    const diffToMergedChanges = await this.diff(
      workspace,
      repoName,
      commit.hash,
      commit.parents[1].hash,
    );
    if (diffToMergedChanges.trim() === '') {
      return true;
    }

    // Try to detect empty merges in the case of concurrent changes in master and
    // the branch. If the changes between the branch and the latest master commit
    // are the same as between the merge commit and the latest in master, then the
    // merge commit did not try to sneak in any extra changes.
    const diffMergeToMaster = await this.diff(
      workspace,
      repoName,
      commit.hash,
      commit.parents[0].hash,
    );
    const diffBranchToMaster = await this.diff(
      workspace,
      repoName,
      commit.parents[1].hash,
      commit.parents[0].hash,
    );
    if (diffMergeToMaster === diffBranchToMaster) {
      return true;
    }

    return false;
  }
}
