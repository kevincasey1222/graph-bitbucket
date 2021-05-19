import * as dotenv from 'dotenv';
import * as path from 'path';
import { BitbucketIntegrationConfig } from '../src/types';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

export const integrationConfig: BitbucketIntegrationConfig = {
  oauthKey: process.env.BITBUCKET_OAUTH_KEY || 'testingkey',
  oauthSecret: process.env.BITBUCKET_OAUTH_SECRET || 'testingsecret',
  ingestPullRequests: process.env.BITBUCKET_INGEST_PULL_REQUESTS !== 'false',
  teams: process.env.BITBUCKET_WORKSPACE
    ? [process.env.BITBUCKET_WORKSPACE]
    : ['jupiterone-dev'],
};
