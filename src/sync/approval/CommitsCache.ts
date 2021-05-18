import { IntegrationLogger } from '@jupiterone/integration-sdk-core';

import BitbucketClient from '../../clients/BitbucketClient';
import {
  BitbucketCommit,
  BitbucketCommitHash,
  BitbucketPR,
  BitbucketPRState,
} from '../../types';
import { Update } from './parsePRActivity';

interface CommitsUpToDestination {
  commits: BitbucketCommit[];
  commitsMissing?: boolean;
}

export default class CommitsCache {
  constructor(
    readonly destination: BitbucketCommitHash,
    readonly commits: BitbucketCommit[],
  ) {}

  getCommitsUpToDestination(
    source: BitbucketCommitHash,
    destination: BitbucketCommitHash,
  ): CommitsUpToDestination {
    const sourceIndex = this.commits.findIndex((commit) =>
      commitMatches(commit.hash, source),
    );

    const indexExcludingSource = sourceIndex + 1;
    const commitsExcludingSource = this.commits.slice(indexExcludingSource);
    const destinationIndexRelative = commitMatches(
      this.destination,
      destination,
    )
      ? commitsExcludingSource.length
      : commitsExcludingSource.findIndex((commit) =>
          commitMatches(commit.hash, destination),
        );

    if (sourceIndex < 0 || destinationIndexRelative < 0) {
      return {
        commits: [],
        commitsMissing: true,
      };
    }

    return {
      commits: this.commits.slice(
        sourceIndex,
        destinationIndexRelative + indexExcludingSource,
      ),
    };
  }
}

function commitMatches(
  commit: BitbucketCommitHash,
  match: BitbucketCommitHash,
): boolean {
  return commit.slice(0, match.length) === match;
}

export async function commitsCacheFromUpdates(
  bitbucket: BitbucketClient,
  logger: IntegrationLogger,
  accountUUID: string,
  pr: BitbucketPR,
  updates: Update[],
) {
  let destination: BitbucketCommitHash = '';
  let commits: BitbucketCommit[] = [];

  if (updates.length > 0) {
    /**
     * If the last update is a merge, the second to last commit (so as to avoid
     * grabbing an updated version of master); if not, then the last update (to
     * ensure we capture all commits on the PR).
     *
     * What is "an updated version of master", you ask? Take, for example, this
     * list of updates.
     *
     * commit_a (master) → commit_b
     * commit_b → commit_c
     * commit_c → master (merge commit)
     *
     * If the head of master moves between commit_a and the merge, then the
     * destination of the last update will be the "updated version of master"
     * (I.E. the merge commit that was merged between commit_a and the merge
     * commit of the pull request).
     */
    const lastOpenUpdate =
      updates[updates.length - 1].state !== BitbucketPRState.Merged
        ? updates[updates.length - 1]
        : updates[updates.length - 2];

    const source = lastOpenUpdate.sourceCommitHash;
    destination = lastOpenUpdate.destinationCommitHash;

    try {
      commits = await bitbucket.getCommits(
        accountUUID,
        pr.source.repository.uuid,
        source,
        destination,
      );
    } catch (err) {
      /**
       * A 404 means that either the source or destination of the pull request
       * approvals was removed from git history. Removing commits from git
       * history is not proper and therefore we cannot approve it.
       *
       * An error status other than 404 means something went sideways for real,
       * in a way that this code doesn't handle. We log this for later
       * investigation.
       *
       * In either situation, we will leave the commits array empty, so that
       * later when they are put into the cache and iterated over, we end up
       * with a no-op.
       *
       * For more info, see expandApprovedRangesToCommitList.
       *
       * TODO: Add a string to the entity that explains why there are no
       * associated commits.
       */
      if (!(err.response && err.response.status === 404)) {
        logger.warn({ err, pullRequest: pr }, "Couldn't get commits for PR");
      }
    }
  }

  return new CommitsCache(destination, commits);
}
