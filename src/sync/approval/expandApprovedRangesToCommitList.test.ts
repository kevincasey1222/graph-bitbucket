import { expandApprovedRangesToCommitList } from './expandApprovedRangesToCommitList';
import { expectedApprovals } from '../../../test/fixtures/prApprovals';
import { Approval } from './parsePRActivity';
import CommitsCache from './CommitsCache';
import { BitbucketPRState } from '../../types';
import { createMockExecutionContext } from '@jupiterone/integration-sdk-testing';

jest.mock('./CommitsCache');

describe('expandApprovedRangesToCommitList', function () {
  test('logs and returns no commits when commits are missing', async function () {
    const { logger } = createMockExecutionContext();
    const loggerInfoSpy = jest.spyOn(logger, 'info');
    const commitsCache = new CommitsCache('', []);
    (commitsCache.getCommitsUpToDestination as jest.Mock).mockReturnValue({
      commits: [],
      commitsMissing: true,
    });

    const approvedCommits = await expandApprovedRangesToCommitList(
      logger,
      commitsCache,
      expectedApprovals,
    );

    expect(approvedCommits).toEqual({
      commits: [],
      approvedCommitsRemoved: true,
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      {
        approvals:
          '{4845a246-46c4-4a60-8aea-8e547924eda4} on PR #19, ' +
          '{e89989b2-8d05-46b4-a09c-3f717c66a46e} on PR #19, ' +
          '{3043c9b5-598f-4158-8ed1-75de951ab6ae} on PR #19',
        sourceCommitHash: 'a55925b94c18',
        destinationCommitHash: '20c8b26957b8',
        repoOwnerUUID: 'lifeomic',
        repoSlug: 'fhir-gateway',
      },
      'Approvals were found for range, but one of the commits does not exist anymore',
    );
  });

  test("doesn't include commits approved only by their author", async function () {
    const { logger } = createMockExecutionContext();

    const commits1 = require('../../../test/fixtures/commitsWithSelfApproval.1');
    const commits2 = require('../../../test/fixtures/commitsWithSelfApproval.2');
    const approvals: Approval[] = [
      {
        repoOwnerUUID: 'lifeomic',
        repoSlug: 'lab-upload-agent',
        prId: '19',
        approverUUIDs: ['{7e9ef3b1-3b7b-47e3-9f5d-16adfac2daee}'],
        sourceCommitHash: '1d03d1f26770',
        destinationCommitHash: '6ff12dbcff26',
        state: BitbucketPRState.Open,
      },
      {
        repoOwnerUUID: 'lifeomic',
        repoSlug: 'lab-upload-agent',
        prId: '19',
        approverUUIDs: ['{7e9ef3b1-3b7b-47e3-9f5d-16adfac2daee}'],
        sourceCommitHash: 'dc4e65b4076d',
        destinationCommitHash: '1d03d1f26770',
        state: BitbucketPRState.Open,
      },
    ];

    const commitsCache = new CommitsCache('', []);
    (commitsCache.getCommitsUpToDestination as jest.Mock).mockReturnValueOnce({
      commits: commits1,
      approvedCommitsRemoved: false,
    });
    (commitsCache.getCommitsUpToDestination as jest.Mock).mockReturnValueOnce({
      commits: commits2,
      approvedCommitsRemoved: false,
    });

    const approvedCommits = await expandApprovedRangesToCommitList(
      logger,
      commitsCache,
      approvals,
    );

    expect(approvedCommits).toEqual({
      commits: [commits1[0]],
      approvedCommitsRemoved: false,
    });
  });
});
