import CommitsCache from './CommitsCache';
import { BitbucketCommit } from '../../types';

const author = {
  user: {
    display_name: 'Marty McFly',
    nickname: 'marty',
    uuid: 'marty_mcfly',
  },
  raw: 'meat',
};

const commitA: any = {
  author,
  hash: 'e40d50471337bfab2df4c34f452fe6bddcea41d0',
  message: 'commit message',
};

const commitB: any = {
  author,
  hash: 'a527f1ffd3e7df432234620b80d64ab9b5f57965',
  message: 'commit message',
};

const commitC: any = {
  author,
  hash: '0f1485a2f5527aa9f47f21c1f2bc09e18c7823ab',
  message: 'commit message',
};

const commitD: any = {
  author,
  hash: '80800d1191784c98d0eb5d728d40aff1bf1d1a06',
  message: 'commit message',
};

const commitE: any = {
  author,
  hash: '8446386f906e377c59aefcd56535015b3f850ae3',
  message: 'commit message',
};

const commits: BitbucketCommit[] = [
  commitA,
  commitB,
  commitC,
  commitD,
  commitE,
];

const commitsCache = new CommitsCache(
  '39fd5b991115237c1ab50f7fd5b99a3d8843b2b3',
  commits,
);

test('returns range of commits', () => {
  expect(
    commitsCache.getCommitsUpToDestination(commitA.hash, commitE.hash),
  ).toEqual({ commits: [commitA, commitB, commitC, commitD] });
});

test('returns up to the destination', () => {
  expect(
    commitsCache.getCommitsUpToDestination(
      commitC.hash,
      '39fd5b991115237c1ab50f7fd5b99a3d8843b2b3',
    ),
  ).toEqual({ commits: [commitC, commitD, commitE] });
});

test('returns range from partial commit hashes', () => {
  expect(
    commitsCache.getCommitsUpToDestination('0f1485a2f5', '39fd5b9911'),
  ).toEqual({ commits: [commitC, commitD, commitE] });
});

test('returns error when source or destination does not exist', () => {
  expect(commitsCache.getCommitsUpToDestination('x', commitE.hash)).toEqual({
    commits: [],
    commitsMissing: true,
  });
  expect(commitsCache.getCommitsUpToDestination(commitA.hash, 'x')).toEqual({
    commits: [],
    commitsMissing: true,
  });
});
