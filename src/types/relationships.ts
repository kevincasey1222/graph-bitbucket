import { ExplicitRelationship } from '@jupiterone/integration-sdk-core';

export interface BitbucketWorkspaceRepoRelationship
  extends ExplicitRelationship {
  _type: 'bitbucket_workspace_owns_repo';
}

export interface BitbucketWorkspaceUserRelationship
  extends ExplicitRelationship {
  _type: 'bitbucket_workspace_has_user';
}

export interface BitbucketWorkspaceGroupRelationship
  extends ExplicitRelationship {
  _type: 'bitbucket_workspace_has_group';
}

export interface BitbucketGroupUserRelationship extends ExplicitRelationship {
  _type: 'bitbucket_group_has_user';
}

export interface BitbucketUserGroupRelationship extends ExplicitRelationship {
  _type: 'bitbucket_user_owns_group';
}

export interface BitbucketWorkspaceProjectRelationship
  extends ExplicitRelationship {
  _type: 'bitbucket_workspace_owns_project';
}

export interface BitbucketProjectRepoRelationship extends ExplicitRelationship {
  _type: 'bitbucket_project_has_repo';
}

export interface BitbucketRepoPullRequestRelationship
  extends ExplicitRelationship {
  _type: 'bitbucket_repo_has_pullrequest';
}

export type BitbucketUserPullRequestRelationship = ExplicitRelationship;
