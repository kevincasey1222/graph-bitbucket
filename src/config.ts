import {
  IntegrationExecutionContext,
  IntegrationInstanceConfigFieldMap,
  IntegrationInstanceConfig,
} from '@jupiterone/integration-sdk-core';
import { createAPIClient } from './client';

/**
 * A type describing the configuration fields required to execute the
 * integration for a specific account in the data provider.
 *
 * When executing the integration in a development environment, these values may
 * be provided in a `.env` file with environment variables. For example:
 *
 * - `CLIENT_ID=123` becomes `instance.config.clientId = '123'`
 * - `CLIENT_SECRET=abc` becomes `instance.config.clientSecret = 'abc'`
 *
 * Environment variables are NOT used when the integration is executing in a
 * managed environment. For example, in JupiterOne, users configure
 * `instance.config` in a UI.
 */

export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  bitbucketOauthKey: {
    type: 'string',
  },
  bitbucketOauthSecret: {
    type: 'string',
    mask: true,
  },
  bitbucketTeams: {
    type: 'string',
  },
  bitbucketIngestPullRequests: {
    type: 'boolean',
  },
};

/**
 * Properties provided by the `IntegrationInstance.config`. This reflects the
 * same properties defined by `instanceConfigFields`.
 */
export interface IntegrationConfig extends IntegrationInstanceConfig {
  /**
   * The BitBucket Oauth key used to authenticate requests.
   */
  bitbucketOauthKey: string;

  /**
   * The BitBucket Oauth secret used to authenticate requests.
   */
  bitbucketOauthSecret: string;

  /**
   * The name of the BitBucket workspace, or a comma-delimited list of names.
   */
  bitbucketTeams: string;

  /**
   * Whether Pull Request ingestion is desired.
   * Optional. Defaults to true. Set to 'false' if PRs are not desired
   */
  bitbucketIngestPullRequests?: boolean;
}

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  //to support old config fields with new code
  const config = context.instance.config;
  config.oauthKey = config.bitbucketOauthKey;
  config.oauthSecret = config.bitbucketOauthSecret;
  config.workspace = config.bitbucketTeams;
  config.ingestPullRequests = config.bitbucketIngestPullRequests;
  const apiClient = createAPIClient(context.instance.config, context);
  await apiClient.verifyAuthentication();
}
