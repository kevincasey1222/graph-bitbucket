import { workspaceSteps } from './workspaces';
import { userSteps } from './users';
import { projectSteps } from './projects';
import { repoSteps } from './repos';
import { prSteps } from './pullrequests';

const integrationSteps = [
  ...workspaceSteps,
  ...userSteps,
  ...projectSteps,
  ...repoSteps,
  ...prSteps,
];

export { integrationSteps };
