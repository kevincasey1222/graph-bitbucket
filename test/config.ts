import * as dotenv from 'dotenv';
import * as path from 'path';
import { IntegrationConfig } from '../src/config';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

export const integrationConfig: IntegrationConfig = {
  //both property name types for compatibility with old configs and new code
  oauthKey: process.env.BITBUCKET_OAUTH_KEY || 'testingkey',
  oauthSecret: process.env.BITBUCKET_OAUTH_SECRET || 'testingsecret',
  bingestPullRequests: process.env.BITBUCKET_INGEST_PULL_REQUESTS !== 'false',
  workspace: process.env.BITBUCKET_WORKSPACE
    ? process.env.BITBUCKET_WORKSPACE
    : 'jupiterone-dev',
  bitbucketOauthKey: process.env.BITBUCKET_OAUTH_KEY || 'testingkey',
  bitbucketOauthSecret: process.env.BITBUCKET_OAUTH_SECRET || 'testingsecret',
  bitbucketIngestPullRequests:
    process.env.BITBUCKET_INGEST_PULL_REQUESTS !== 'false',
  bitbucketWorkspace: process.env.BITBUCKET_WORKSPACE
    ? process.env.BITBUCKET_WORKSPACE
    : 'jupiterone-dev',
};
