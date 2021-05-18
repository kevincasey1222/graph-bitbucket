/* eslint-disable @typescript-eslint/require-await */

import {
  BitbucketCommitHash,
  BitbucketPR,
  BitbucketPRActivity,
  BitbucketPRState,
} from '../../types';

export interface Update {
  // This could be a workspace or a user, so we need to use the repo owner's
  // UUID instead of username.  It is also used in non-workspace API calls,
  // which means it must be a UUID even if it refers to a workspace.
  repoOwnerUUID: string;
  repoSlug: string;
  prId: string;
  sourceCommitHash: BitbucketCommitHash;
  destinationCommitHash: BitbucketCommitHash;
  state: BitbucketPRState;
}

export interface Approval extends Update {
  approverUUIDs: string[];
}

export interface ParsedActivity {
  updates: Update[];
  approvals: Approval[];
}

function equal(a: any, b: any, props: string[]) {
  if (a === undefined || b === undefined) return false;

  for (const prop of props) {
    if (a[prop] !== b[prop]) {
      return false;
    }
  }

  return true;
}

export default async function parsePRActivity(
  prOwnerUUID: string,
  pr: BitbucketPR,
  activities: BitbucketPRActivity[],
): Promise<ParsedActivity> {
  const repoSlug = pr.source.repository.name;

  interface State {
    proposedChanges?: Update;
    updates: Update[];
    approvals: Approval[];
  }

  const state = activities.reduceRight(
    (state: State, activity: BitbucketPRActivity): State => {
      if (activity.update) {
        const sourceCommitHash = activity.update.source.commit.hash;
        if (!sourceCommitHash) {
          throw new Error(
            `PR ${pr.id} in ${prOwnerUUID}/${repoSlug} has an update without a source commit hash`,
          );
        }

        const destinationCommitHash = activity.update.destination.commit.hash;
        if (!destinationCommitHash) {
          throw new Error(
            `PR ${pr.id} in ${prOwnerUUID}/${repoSlug} has an update without a destination commit hash`,
          );
        }

        /**
         * Overwriting the proposed changes for every update works even if the
         * PR activity contains more than one update in a row because Bitbucket
         * only moves the destination (and not the source) in updates if there
         * are no approvals in between updates.
         */
        state.proposedChanges = {
          repoOwnerUUID: prOwnerUUID,
          repoSlug,
          prId: pr.id,
          sourceCommitHash,
          destinationCommitHash,
          state: activity.update.state,
        };
        state.updates.push(state.proposedChanges);
      }

      if (activity.approval) {
        if (!state.proposedChanges) {
          throw new Error(
            `PR ${pr.id} in ${prOwnerUUID}/${repoSlug} has an approval before any changes are proposed`,
          );
        }

        const approverUUID = activity.approval.user.uuid;
        if (!approverUUID) {
          throw new Error(
            `PR ${pr.id} in ${prOwnerUUID}/${repoSlug} has an approval without a username`,
          );
        }

        const existingApproval = state.approvals.find((approval) => {
          return equal(approval, state.proposedChanges, [
            'repoOwnerUUID',
            'repoSlug',
            'sourceCommitHash',
            'destinationCommitHash',
          ]);
        });

        if (existingApproval) {
          existingApproval.approverUUIDs.push(approverUUID);
        } else {
          state.approvals.push({
            ...state.proposedChanges,
            approverUUIDs: [approverUUID],
          });
        }
      }

      return state;
    },
    { approvals: [], updates: [] },
  );

  return {
    approvals: state.approvals,
    updates: state.updates,
  };
}
