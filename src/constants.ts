export const BITBUCKET_WORKSPACE_ENTITY_TYPE = 'bitbucket_workspace';
export const BITBUCKET_WORKSPACE_ENTITY_CLASS = 'Account';
export const BITBUCKET_WORKSPACE_USER_RELATIONSHIP_TYPE =
  'bitbucket_workspace_has_user';
export const BITBUCKET_WORKSPACE_REPO_RELATIONSHIP_TYPE =
  'bitbucket_workspace_owns_repo';
export const BITBUCKET_WORKSPACE_PROJECT_RELATIONSHIP_TYPE =
  'bitbucket_workspace_owns_project';

export const BITBUCKET_USER_ENTITY_TYPE = 'bitbucket_user';
export const BITBUCKET_USER_ENTITY_CLASS = 'User';
export const BITBUCKET_USER_OPENED_PR_RELATIONSHIP_TYPE =
  'bitbucket_user_opened_pullrequest';
export const BITBUCKET_USER_REVIEWED_PR_RELATIONSHIP_TYPE =
  'bitbucket_user_reviewed_pullrequest';
export const BITBUCKET_USER_APPROVED_PR_RELATIONSHIP_TYPE =
  'bitbucket_user_approved_pullrequest';

export const BITBUCKET_REPO_ENTITY_TYPE = 'bitbucket_repo';
export const BITBUCKET_REPO_ENTITY_CLASS = 'CodeRepo';
export const BITBUCKET_REPO_PR_RELATIONSHIP_TYPE =
  'bitbucket_repo_has_pullrequest';

export const BITBUCKET_PROJECT_ENTITY_TYPE = 'bitbucket_project';
export const BITBUCKET_PROJECT_ENTITY_CLASS = 'Project';
export const BITBUCKET_PROJECT_REPO_RELATIONSHIP_TYPE =
  'bitbucket_project_has_repo';

export const BITBUCKET_PR_ENTITY_TYPE = 'bitbucket_pullrequest';
export const BITBUCKET_PR_ENTITY_PRIMARY_CLASS = 'PR';
export const BITBUCKET_PR_ENTITY_CLASSES = [
  'Review',
  BITBUCKET_PR_ENTITY_PRIMARY_CLASS,
];
