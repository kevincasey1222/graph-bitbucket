import parsePRActivity from './parsePRActivity';

import { expectedApprovals } from '../../../test/fixtures/prApprovals';

jest.mock('../../clients/BitbucketClient');

test('parsePRActivity returns approvals parsed from PR activity', async function () {
  const pr = require('../../../test/fixtures/pr.json');
  const prActivity = require('../../../test/fixtures/prActivity.json');

  const parsedActivity = await parsePRActivity('lifeomic', pr, prActivity);
  expect(parsedActivity.approvals).toEqual(expectedApprovals);
  // TODO: add check for updates
});
