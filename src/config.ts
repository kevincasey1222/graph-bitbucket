import {
  IntegrationExecutionContext,
  IntegrationInstanceConfigFieldMap,
  IntegrationInstanceConfig,
  IntegrationValidationError,
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

//ideally, these fields would match the fields coming from the UI
//in this case, there will be an inconsistency, where we are using
//`workspace` but the UI still says teams.
//also, workspace is really an array in the code, but arrays are not
//supported in processing the .env file
//lastly, ingestPullRequests is optional in the UI, but not here because
//optional fields are not supported here
export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  oauthKey: {
    type: 'string',
  },
  oauthSecret: {
    type: 'string',
    mask: true,
  },
  workspace: {
    type: 'string',
  },
  ingestPullRequests: {
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
  oauthKey: string;

  /**
   * The BitBucket Oauth secret used to authenticate requests.
   */
  oauthSecret: string;

  /**
   * The name of the BitBucket workspace, or a comma-delimited list of names.
   */
  workspace: string[];

  /**
   * Whether Pull Request ingestion is desired.
   * Optional. Defaults to true. Set to 'false' if PRs are not desired
   * This default value is set in validateInvocation below.
   */
  ingestPullRequests?: boolean;
}

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  //there's a little bit of crazy here trying to account for old and new patterns
  //the idea is that the crazy is resolved by the end of this function
  const config = context.instance.config;
  //customer instances loaded through the UI will use `teams` instead of `workspace`
  if (config.teams) {
    config.workspace = config.teams;
  }
  //the .env loader doesn't support arrays, but workspace is meant to be an array
  //`teams` from customer instances will be an array
  if (typeof config.workspace === 'string') {
    config.workspace = (<string>config.workspace).split(','); //what a hack!
  }
  //customer instances loaded through the UI may not have a value for `ingestPullRequests`
  //if no value, we want ingestPullRequests to be true
  config.ingestPullRequests = config.IngestPullRequests !== 'false';

  if (!config.oauthKey || !config.oauthSecret || !config.workspace) {
    throw new IntegrationValidationError(
      'Config requires all of {oauthKey, oauthSecret, (workspace | teams)}',
    );
  }

  const apiClient = createAPIClient(context.instance.config, context);
  await apiClient.verifyAuthentication();
}
