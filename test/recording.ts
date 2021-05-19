import {
  Recording,
  RecordingEntry,
  setupRecording,
  SetupRecordingInput,
} from '@jupiterone/integration-sdk-testing';
import { gunzipSync } from 'zlib';
import { BitbucketWorkspaceMembership } from '../src/types';

export { Recording };

export function setupBitbucketRecording(
  input: Omit<SetupRecordingInput, 'mutateEntry'>,
): Recording {
  return setupRecording({
    ...input,
    mutateEntry: mutateRecordingEntry,
  });
}

function mutateRecordingEntry(entry: RecordingEntry): void {
  let responseText = entry.response.content.text;
  if (!responseText) {
    return;
  }

  const contentEncoding = entry.response.headers.find(
    (e) => e.name === 'content-encoding',
  );
  const transferEncoding = entry.response.headers.find(
    (e) => e.name === 'transfer-encoding',
  );

  if (contentEncoding && contentEncoding.value === 'gzip') {
    const chunkBuffers: Buffer[] = [];
    const hexChunks = JSON.parse(responseText) as string[];
    hexChunks.forEach((chunk) => {
      const chunkBuffer = Buffer.from(chunk, 'hex');
      chunkBuffers.push(chunkBuffer);
    });

    responseText = gunzipSync(Buffer.concat(chunkBuffers)).toString('utf-8');

    // Remove encoding/chunking since content is now unzipped
    entry.response.headers = entry.response.headers.filter(
      (e) => e && e !== contentEncoding && e !== transferEncoding,
    );
    // Remove recording binary marker
    delete (entry.response.content as any)._isBinary;
    entry.response.content.text = responseText;
  }

  const responseJson = parseJson(responseText);
  if (responseJson) {
    if (/oauth2/.exec(entry.request.url) && entry.request.postData) {
      if (responseJson.access_token) {
        entry.response.content.text = JSON.stringify(
          {
            ...responseJson,
            access_token: '[REDACTED]',
            refresh_token: '[REDACTED]',
          },
          null,
          0,
        );
      }
    }

    if (/\/members$/.exec(entry.request.url)) {
      entry.response.content.text = JSON.stringify(
        {
          ...responseJson,
          values: sanitizeMembers(responseJson.values),
        },
        null,
        0,
      );
    }
  }
}

function sanitizeMembers(values: BitbucketWorkspaceMembership[]) {
  return values.slice(0, 3).map((membership, index) => {
    return {
      ...membership,
      user: {
        ...membership.user,
        display_name: `User ${index}`,
        nickname: `Nickname ${index}`,
      },
    };
  });
}

function parseJson(str: string): any {
  try {
    return JSON.parse(str);
  } catch (e) {
    return undefined;
  }
}
