import { calculatePRRequestFilter, getPRActivityWithLog } from './helpers';
import parsePRActivity from './approval/parsePRActivity';

jest.mock('./approval/parsePRActivity');

describe('#calculatePRRequestFilter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(new Date('2001-09-11T08:41:00.000Z').getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('uses date one day ago if no completed jobs', () => {
    expect(calculatePRRequestFilter(null)).toBe(
      'created_on >= 2001-09-10T08:41:00.000Z OR updated_on >= 2001-09-10T08:41:00.000Z',
    );
  });

  test('uses date one day ago if completed job is more than one day ago', () => {
    const lastCompletedJob = new Date(Date.now());
    lastCompletedJob.setDate(lastCompletedJob.getDate() - 8);
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(new Date('2001-09-11T08:41:00.000Z').getTime());
    expect(calculatePRRequestFilter(lastCompletedJob.getTime())).toBe(
      'created_on >= 2001-09-10T08:41:00.000Z OR updated_on >= 2001-09-10T08:41:00.000Z',
    );
  });

  test('uses date of last completed job', () => {
    const lastCompletedJob = new Date('2001-09-10T20:41:00.000Z');

    expect(calculatePRRequestFilter(lastCompletedJob.getTime())).toBe(
      'created_on >= 2001-09-10T20:41:00.000Z OR updated_on >= 2001-09-10T20:41:00.000Z',
    );
  });
});

describe('#getPRActivityWithLog', () => {
  const logger: any = {
    info: jest.fn(),
  };
  const mockBitbucket: any = {
    getPRActivity: jest.fn().mockResolvedValue('activity'),
  };
  const mockPR: any = {
    source: {
      repository: {
        name: 'mcdonalds',
        full_name: 'ronald/mcdonalds',
      },
    },
    id: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns parsed activity', async function () {
    (parsePRActivity as jest.Mock).mockResolvedValue('parsed activity');

    await expect(
      getPRActivityWithLog(mockBitbucket, logger, 'account', mockPR),
    ).resolves.toEqual('parsed activity');
    expect(mockBitbucket.getPRActivity).toHaveBeenCalledWith(
      'account',
      'mcdonalds',
      3,
    );
    expect(parsePRActivity).toHaveBeenCalledWith('account', mockPR, 'activity');
  });

  test('logs PR info when querying Bitbucket for activity fails', async function () {
    const mockBitbucket: any = {
      getPRActivity: jest
        .fn()
        .mockRejectedValue(new Error('can i get a uhhhh McSorceress Supreme?')),
    };

    await expect(
      getPRActivityWithLog(mockBitbucket, logger, 'account', mockPR),
    ).resolves.toEqual({ approvals: [], updates: [] });
    expect(logger.info).toHaveBeenCalledWith(
      {
        prId: 3,
        repository: 'ronald/mcdonalds',
        err: new Error('can i get a uhhhh McSorceress Supreme?'),
      },
      'Could not extract approvals from pull request.',
    );
  });

  test('logs PR info when parsing activity fails', async function () {
    (parsePRActivity as jest.Mock).mockRejectedValue(
      new Error('ice cream machine broked'),
    );

    await expect(
      getPRActivityWithLog(mockBitbucket, logger, 'account', mockPR),
    ).resolves.toEqual({ approvals: [], updates: [] });
    expect(logger.info).toHaveBeenCalledWith(
      {
        prId: 3,
        repository: 'ronald/mcdonalds',
        err: new Error('ice cream machine broked'),
      },
      'Could not extract approvals from pull request.',
    );
  });
});
