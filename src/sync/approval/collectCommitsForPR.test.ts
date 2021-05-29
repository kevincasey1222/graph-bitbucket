import {
  createMockExecutionContext,
  createMockIntegrationLogger,
} from '@jupiterone/integration-sdk-testing';
import BitbucketClient from '../../clients/BitbucketClient';
import {
  BitbucketCommit,
  BitbucketCommitAuthor,
  BitbucketPR,
} from '../../types';
import collectCommitsForPR from './collectCommitsForPR';
import { expandApprovedRangesToCommitList } from './expandApprovedRangesToCommitList';
import parsePRActivity from './parsePRActivity';

jest.mock('../../clients/BitbucketClient');
jest.mock('./expandApprovedRangesToCommitList');
jest.mock('./parsePRActivity');

test('#collectCommitsForPR', async function () {
  const validUser = {
    display_name: "I'm the Good Guy",
    nickname: 'Valid Person',
    uuid: 'valid_person',
  };
  const badUser = {
    display_name: "I'm the Bad Guy (duh)",
    nickname: 'Unknown Person',
    uuid: 'unknown_person',
  };

  const commitA: any = {
    author: {
      user: validUser,
      raw: 'hotdog',
    },
    hash: 'commit_a',
    message: 'commit message',
  };
  const commitB: any = {
    author: {
      user: validUser,
      raw: 'fish',
    },
    hash: 'commit_b',
    message: 'commit message',
  };
  const commitC: any = {
    author: {
      user: badUser,
      raw: 'hamburger',
    },
    hash: 'commit_c',
    message: 'commit message',
  };
  const commitD: any = {
    author: {
      raw: 'steak',
    } as BitbucketCommitAuthor,
    hash: 'commit_d',
    message: 'commit message',
  };

  const commitRange: BitbucketCommit[] = [commitA, commitB, commitC, commitD];

  const approvedCommits = [commitA];
  const commitsByUnknownAuthor = [commitC, commitD];
  const pr = {
    source: {
      repository: {
        uuid: 'source_repo_uuid',
      },
      commit: {
        hash: commitRange[0].hash,
      },
    },
    destination: {
      commit: {
        hash: commitRange[commitRange.length - 1].hash,
      },
    },
  } as BitbucketPR;

  const { logger } = createMockExecutionContext();

  const bitbucket = new BitbucketClient(createMockIntegrationLogger(), {
    oauthKey: '',
    oauthSecret: '',
  });
  (bitbucket.getCommits as jest.Mock).mockResolvedValue(commitRange);
  (bitbucket.getPRActivity as jest.Mock).mockResolvedValue('activity');

  (parsePRActivity as jest.Mock).mockResolvedValue({
    updates: [
      {
        sourceCommitHash: 'commit_a',
        destinationCommitHash: 'commit_d',
        state: '',
      },
    ],
  });
  (expandApprovedRangesToCommitList as jest.Mock).mockResolvedValue({
    commits: approvedCommits,
    removedCommits: false,
  });

  await expect(
    collectCommitsForPR(
      bitbucket,
      logger,
      'account_uuid',
      [validUser.uuid],
      pr,
    ),
  ).resolves.toEqual({
    allCommits: commitRange,
    commitsByUnknownAuthor,
    approvedCommits,
  });
  expect(bitbucket.getCommits).toHaveBeenCalledWith(
    'account_uuid',
    'source_repo_uuid',
    'commit_a',
    'commit_d',
  );
});
