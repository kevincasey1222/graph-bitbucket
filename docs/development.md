# Development

Bitbucket limits calls to the endpoints we are using to 1000 / hour, in a
rolling window.

## Prerequisites

Just the usual NodeJs, Yarn.

## Provider account setup

Please provide information about the steps needed to create an account with a
provider. Images and references to a provider's documentation is very helpful
for new developers picking up your work.

## Authentication

Bitbucket uses a Oauth flow, wherein the client provides an Oauth key, an Oauth
secret, and a "workspace".

The other parameter specified for this integration, ingestPullRequests, is not
authentication related. It simply tells the integration whether to ingest PRs
into the JupiterOne graph.

You can see the fields names for these values specified in the
[`IntegrationInstanceConfigFieldMap`](../src/config.ts).
