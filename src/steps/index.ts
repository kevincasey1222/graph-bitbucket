import { workspaceSteps } from './workspaces';
import { userSteps } from './users';
import { projectSteps } from './projects';
import { repoSteps } from './repos';
import { prSteps } from './pullrequests';
import { groupSteps } from './groups';

const integrationSteps = [
  ...workspaceSteps,
  ...userSteps,
  ...groupSteps,
  ...projectSteps,
  ...repoSteps,
  ...prSteps,
];

export { integrationSteps };
