import {
  createMockStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';
import { IntegrationConfig } from '../config';
import { fetchUsers } from './users';
import { fetchWorkspaces } from './workspaces';
import { setupBitbucketRecording } from '../../test/recording';
import { integrationConfig } from '../../test/config';
import { fetchProjects } from './projects';
import { fetchRepos } from './repos';

let recording: Recording;
afterEach(async () => {
  await recording.stop();
});

test('should collect data', async () => {
  recording = setupBitbucketRecording({
    directory: __dirname,
    name: 'steps', //redaction of headers is in setupBitbucketRecording
  });

  const context = createMockStepExecutionContext<IntegrationConfig>({
    instanceConfig: {
      bitbucketOauthKey: integrationConfig.oauthKey,
      bitbucketOauthSecret: integrationConfig.oauthSecret,
      bitbucketWorkspace: integrationConfig.teams || 'jupiterone-dev',
    },
  });

  // Simulates dependency graph execution.
  // See https://github.com/JupiterOne/sdk/issues/262.
  await fetchWorkspaces(context);
  await fetchUsers(context);
  await fetchProjects(context);
  await fetchRepos(context);

  // Review snapshot, failure is a regression
  expect({
    numCollectedEntities: context.jobState.collectedEntities.length,
    numCollectedRelationships: context.jobState.collectedRelationships.length,
    collectedEntities: context.jobState.collectedEntities,
    collectedRelationships: context.jobState.collectedRelationships,
    encounteredTypes: context.jobState.encounteredTypes,
  }).toMatchSnapshot();

  const accounts = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Account'),
  );
  expect(accounts.length).toBeGreaterThan(0);
  expect(accounts).toMatchGraphObjectSchema({
    _class: ['Account'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_workspace' },
        slug: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: [],
    },
  });

  const users = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('User'),
  );
  expect(users.length).toBeGreaterThan(0);
  expect(users).toMatchGraphObjectSchema({
    _class: ['User'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_user' },
        displayName: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['displayName'],
    },
  });

  const projects = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Project'),
  );
  expect(projects.length).toBeGreaterThan(0);
  expect(projects).toMatchGraphObjectSchema({
    _class: ['Project'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_project' },
        name: { type: 'string' },
        workspace: { type: 'string' },
        webLink: { type: 'string', format: 'url' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'workspace', 'webLink'],
    },
  });

  const repos = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('CodeRepo'),
  );
  expect(repos.length).toBeGreaterThan(0);
  expect(repos).toMatchGraphObjectSchema({
    _class: ['CodeRepo'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'bitbucket_repo' },
        name: { type: 'string' },
        ownerId: { type: 'string' },
        projectId: { type: 'string' },
        webLink: { type: 'string', format: 'url' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name', 'ownerId', 'projectId', 'webLink'],
    },
  });
});
