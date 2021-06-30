import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig, sanitizeConfig } from '../config';
import {
  createUserEntity,
  createWorkspaceHasUserRelationship,
} from '../sync/converters';
import {
  BITBUCKET_WORKSPACE_ENTITY_TYPE,
  BITBUCKET_USER_ENTITY_TYPE,
  BITBUCKET_USER_ENTITY_CLASS,
  BITBUCKET_WORKSPACE_USER_RELATIONSHIP_TYPE,
  DATA_USER_BY_ID_MAP,
  DATA_USER_ID_ARRAY,
} from '../constants';
import {
  BitbucketWorkspaceEntity,
  BitbucketUserEntity,
  IdEntityMap,
} from '../types';

export async function fetchUsers(
  context: IntegrationStepExecutionContext<IntegrationConfig>,
) {
  const jobState = context.jobState;
  const apiClient = createAPIClient(
    sanitizeConfig(context.instance.config),
    context,
  );

  //an array and a map are needed later by other steps
  const userByIdMap: IdEntityMap<BitbucketUserEntity> = {};
  const userIds: string[] = [];

  await jobState.iterateEntities(
    {
      _type: BITBUCKET_WORKSPACE_ENTITY_TYPE,
    },
    async (workspaceEntity) => {
      if (workspaceEntity.slug) {
        const slug: string = <string>workspaceEntity.slug;
        await apiClient.iterateUsers(slug, async (user) => {
          const convertedUser = createUserEntity(user);
          const userEntity = (await jobState.addEntity(
            createIntegrationEntity({
              entityData: {
                source: user,
                assign: convertedUser,
              },
            }),
          )) as BitbucketUserEntity;
          const workspace: BitbucketWorkspaceEntity = <
            BitbucketWorkspaceEntity
          >workspaceEntity;
          await jobState.addRelationship(
            createWorkspaceHasUserRelationship(workspace, userEntity),
          );
          userByIdMap[user.uuid] = userEntity;
          userIds.push(userEntity._key);
        });
      }
    },
  );

  await jobState.setData(DATA_USER_BY_ID_MAP, userByIdMap);
  await jobState.setData(DATA_USER_ID_ARRAY, userIds);
}

export const userSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [
      {
        resourceName: 'Bitbucket User',
        _type: BITBUCKET_USER_ENTITY_TYPE,
        _class: BITBUCKET_USER_ENTITY_CLASS,
      },
    ],
    relationships: [
      {
        _type: BITBUCKET_WORKSPACE_USER_RELATIONSHIP_TYPE,
        _class: RelationshipClass.HAS,
        sourceType: BITBUCKET_WORKSPACE_ENTITY_TYPE,
        targetType: BITBUCKET_USER_ENTITY_TYPE,
      },
    ],
    dependsOn: ['fetch-workspaces'],
    executionHandler: fetchUsers,
  },
];
