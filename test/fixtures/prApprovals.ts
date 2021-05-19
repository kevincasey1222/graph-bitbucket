import { Approval } from '../../src/sync/approval/parsePRActivity';
import { BitbucketPRState } from '../../src/types';

export const expectedApprovals: Approval[] = [
  {
    repoOwnerUUID: 'lifeomic',
    repoSlug: 'fhir-gateway',
    prId: '19',
    approverUUIDs: [
      '{4845a246-46c4-4a60-8aea-8e547924eda4}',
      '{e89989b2-8d05-46b4-a09c-3f717c66a46e}',
      '{3043c9b5-598f-4158-8ed1-75de951ab6ae}',
    ],
    sourceCommitHash: 'a55925b94c18',
    destinationCommitHash: '20c8b26957b8',
    state: BitbucketPRState.Open,
  },
];
