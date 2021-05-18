import { v4 as uuid } from 'uuid';
import {
  asdf123Commit,
  expectedProjectEntity,
  expectedPullRequestEntity,
  expectedRepoEntity,
  expectedUserEntity,
  expectedWorkspaceEntity,
  hjkl456Commit,
  prApiResponse,
  projectApiResponse,
  qwer789Commit,
  repoApiResponse,
  userApiResponse,
  workspaceApiResponse,
} from '../../test/fixtures/converterData';
import { BitbucketRepo, BitbucketUser } from '../types';
import {
  BitbucketRepoEntity,
  BitbucketUserEntity,
  BitbucketWorkspaceEntity,
} from '../types/entities';
import * as converters from './converters';

test('converters.convertWorkspaceToEntity', () => {
  const entity = converters.convertWorkspaceToEntity(workspaceApiResponse);
  expect(entity).toEqual(expectedWorkspaceEntity);
});

test('converters.convertUserToEntity', () => {
  const entity = converters.convertUserToEntity(
    userApiResponse as BitbucketUser,
  );
  expect(entity).toEqual(expectedUserEntity);
});

test('converters.convertRepoToEntity', () => {
  const entity = converters.convertRepoToEntity(
    '{816bc128-0132-4b85-a3d0-78900493a1f0}',
    repoApiResponse as BitbucketRepo,
  );
  expect(entity).toEqual(expectedRepoEntity);
});

test('converters.convertProjectToEntity', () => {
  const workspace = 'lifeomic';
  const entity = converters.convertProjectToEntity(
    workspace,
    projectApiResponse,
  );
  expect(entity).toEqual(expectedProjectEntity(workspace));
});

describe('converters.convertPRToEntity', () => {
  test('calculates approval values', () => {
    const entity = converters.convertPRToEntity({
      accountUUID: 'le_account',
      pullRequest: prApiResponse,
      commits: [asdf123Commit, hjkl456Commit, qwer789Commit],
      commitsApproved: [asdf123Commit, hjkl456Commit],
      commitsByUnknownAuthor: [hjkl456Commit],
      approvedCommitsRemoved: false,
      approvals: [
        { approverUUIDs: ['{14d17a6c-f0fd-4d1d-a8d2-b143354a2995}'] } as any,
      ],
      usersByUUID: {
        '{14d17a6c-f0fd-4d1d-a8d2-b143354a2995}': {
          name: 'Erkang Zheng',
        } as any,
      },
    });

    expect(entity).toEqual(expectedPullRequestEntity);
  });

  test('sets approved to false if there are no commits', () => {
    const entity = converters.convertPRToEntity({
      accountUUID: 'le_account',
      pullRequest: prApiResponse,
      commits: [],
      commitsApproved: [],
      commitsByUnknownAuthor: [],
      approvedCommitsRemoved: false,
      approvals: [],
    });

    expect(entity).toEqual({
      ...expectedPullRequestEntity,
      commits: [],
      commitMessages: [],
      commitsApproved: [],
      commitsNotApproved: [],
      commitsByUnknownAuthor: [],
      approverIds: [],
      approvers: [],
      validated: true,
    });
  });
});

test('converters.convertWorkspaceUserToRelationship', () => {
  const workspace: BitbucketWorkspaceEntity = {
    _type: 'bitbucket_workspace',
    _class: ['Account'],
    _key: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
    slug: 'lifeomic',
    displayName: 'lifeomic',
  };

  const user: BitbucketUserEntity = {
    _type: 'bitbucket_user',
    _class: 'User',
    _key: '{109cd504-f55e-48a0-8e7a-d04f0b10f016}',
    nickname: 'philgatesidem-lifeomic',
    displayName: 'philgatesidem-lifeomic',
  };

  const relationship = converters.convertWorkspaceUserToRelationship(
    workspace,
    user,
  );

  expect(relationship).toEqual({
    _key: `${workspace._key}|has|${user._key}`,
    _class: 'HAS',
    _type: 'bitbucket_workspace_has_user',
    _fromEntityKey: workspace._key,
    _toEntityKey: user._key,
  });
});

test('converters.convertWorkspaceRepoToRelationship', () => {
  const workspaceEntity: BitbucketWorkspaceEntity = {
    _type: 'bitbucket_workspace',
    _class: 'Account',
    _key: '{816bc128-0132-4b85-a3d0-78900493a1f0}',
    slug: 'lifeomic',
  };

  const repo: BitbucketRepoEntity = {
    _type: 'bitbucket_repo',
    _class: 'CodeRepo',
    _key: '{f964169d-b646-45f3-84e4-075b0ba0ddcd}',
    name: 'wiki',
    fullName: 'lifeomic/wiki',
    public: false,
    owner: 'lifeomic',
    ownerId: uuid(),
    projectId: 'xyz',
    createdOn: 0,
    updatedOn: 0,
  };

  const relationship = converters.convertWorkspaceRepoToRelationship(
    workspaceEntity,
    repo,
  );

  expect(relationship).toEqual({
    _key: `${workspaceEntity._key}|owns|${repo._key}`,
    _class: 'OWNS',
    _type: 'bitbucket_workspace_owns_repo',
    _fromEntityKey: workspaceEntity._key,
    _toEntityKey: repo._key,
  });
});
