# Development

Bitbucket limits calls to repo and PR-related endpoints to 1000 / hour, in a
rolling window, per client id/secret pair. See ./jupiterone.md for a calculation
of the API calls made, depending on settings.

This integration supports the provisioning of multiple client id/secret pairs,
so as to get around the API limits. Simply enter the client ids as a single
string in the client id field, comma delimited. Do the same with the secrets (in
the same order, of course, so that secrets match to ids). If rate-limiting is
encountered on a set of credentials, the integration goes to the next set of
credentials. It does not through a rate-limiting error and give up until it runs
out of credentials to try.

It does not, as this time, loop back to try previous credentials again.

## Provider account setup

You can get a free acount, forever, with upto 5 users at
https://bitbucket.org/account/signup

## API versions

For the most part, this integration accesses API v.2.0. The calls for Groups,
however, still requires API v.1.0. Bitbucket plans to deprecate API v.1.0
entirely once Groups are supported in API v.2.0, but for now, REST calls to
v1.0/groups remain supported.

## Authentication

Bitbucket uses a OAuth flow, wherein the client provides an OAuth key, an OAuth
secret, and a "workspace".

The other parameter specified for this integration, ingestPullRequests, is not
authentication related. It simply tells the integration whether to ingest PRs
into the JupiterOne graph.

You can see the fields names for these values specified in the
[`IntegrationInstanceConfigFieldMap`](../src/config.ts).
