import * as dotenv from 'dotenv';
import * as path from 'path';
import { IntegrationConfig } from '../src/config';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

export const integrationConfig: IntegrationConfig = {
  oauthKey: process.env.OAUTH_KEY || 'testingkey',
  oauthSecret: process.env.OAUTH_SECRET || 'testingsecret',
  ingestPullRequests: process.env.INGEST_PULL_REQUESTS !== 'false',
  //workspace in the config is an array, but the .env var can't be
  workspace: process.env.WORKSPACE
    ? process.env.WORKSPACE.split(',')
    : ['jupiterone-dev'],
};
