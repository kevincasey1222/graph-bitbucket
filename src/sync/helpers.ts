import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import parsePRActivity, { ParsedActivity } from './approval/parsePRActivity';
import BitbucketClient from '../clients/BitbucketClient';
import { BitbucketPR, IdEntityMap, BitbucketUserEntity } from '../types';

export function calculatePRRequestFilter(
  lastCompletedJob: number | null,
): string {
  //new Date() returns the same thing as new Date(Date.now())
  //however, calling Date.now so jest can fake Date.now() in tests
  const date = new Date(Date.now());
  date.setDate(date.getDate() - 30);

  if (lastCompletedJob && lastCompletedJob > date.getTime()) {
    date.setTime(lastCompletedJob);
  }

  const dateStr = date.toISOString();

  return `created_on >= ${dateStr} OR updated_on >= ${dateStr}`;
}

export async function getPRActivityWithLog(
  bitbucket: BitbucketClient,
  logger: IntegrationLogger,
  accountUUID: string,
  pr: BitbucketPR,
) {
  let activity: ParsedActivity = { approvals: [], updates: [] };

  try {
    const activities = await bitbucket.getPRActivity(
      accountUUID,
      pr.source.repository.name,
      pr.id,
    );
    activity = await parsePRActivity(accountUUID, pr, activities);
  } catch (err) {
    logger.info(
      { prId: pr.id, repository: pr.source.repository.full_name, err },
      'Could not extract approvals from pull request.',
    );
  }

  return activity;
}

export function aggregateProperties<T>(
  property: string,
  collection?: any[],
): T[] {
  if (!collection) {
    return [];
  }

  return collection.reduce((aggregatedProperties: T[], source: any) => {
    aggregatedProperties.push(source[property]);
    return aggregatedProperties;
  }, []);
}

export function flattenMatrix<T>(matrix: T[][]): T[] {
  return matrix.reduce((flatArray: T[], row) => {
    flatArray.push(...row);
    return flatArray;
  }, []);
}

export function displayNamesFromUUIDs(
  uuids: string[],
  usersByUUID: IdEntityMap<BitbucketUserEntity>,
): string[] {
  return uuids.reduce((approverNames: string[], approverUUID) => {
    const approver = usersByUUID[approverUUID];
    if (approver && approver.name) {
      approverNames.push(approver.name);
    }
    return approverNames;
  }, []);
}

export function commitMessageSummary(fullMessage: string) {
  return fullMessage.split('\n')[0];
}
