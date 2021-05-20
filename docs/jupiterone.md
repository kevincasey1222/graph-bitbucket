# Integration with JupiterOne

## Bitbucket + JupiterOne Integration Benefits

- Visualize Bitbucket workspaces, projects, repos, pull requests, and users in
  the JupiterOne graph.
- Map Bitbucket users to employees in your JupiterOne account.
- Monitor changes to Bitbucket users using JupiterOne alerts.
- Track which Bitbucket users opened, reviewed, and approved Bitbucket pull
  requests.

## How it Works

- JupiterOne periodically fetches workspaces, projects, repos, and users from
  Bitbucket to update the graph.
- Optionally, JupiterOne fetches pull requests from the last 24 hours, along
  with user activity on those PRs, and adds that information to the graph.
- Write JupiterOne queries to review and monitor updates to the graph, or
  leverage existing queries.
- Configure alerts to take action when JupiterOne graph changes, or leverage
  existing alerts.

## Requirements

- Bitbucket supports the OAuth2 Client Credential flow. You must have a
  Administrator user account.
- JupiterOne requires an Oauth client key, client secret, and the name of your
  Bitbucket workspace. You need permission on Bitbucket to access this
  information.
- You must have permission in JupiterOne to install new integrations.

## Support

If you need help with this integration, please contact
[JupiterOne Support](https://support.jupiterone.io).

## Integration Walkthrough

### In BitBucket

1. Go to the
   [Bitbucket Oauth setup page](https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/)
   for a walkthrough of how to configure Oauth and generate the client id and
   client secret. You only need to do the part at the top under
   `Create a consumer`.
2. Make a note of the client id and client secret, along with the name of the
   workspace to be accessed.

### In JupiterOne

1. From the configuration **Gear Icon**, select **Integrations**.
2. Scroll to the **Bitbucket** integration tile and click it.
3. Click the **Add Configuration** button and configure the following settings:

- Enter the **Account Name** by which you'd like to identify this {{provider}}
  account in JupiterOne. Ingested entities will have this value stored in
  `tag.AccountName` when **Tag with Account Name** is checked.
- Enter a **Description** that will further assist your team when identifying
  the integration instance.
- Select a **Polling Interval** that you feel is sufficient for your monitoring
  needs. You may leave this as `DISABLED` and manually execute the integration.
- Enter the **Bitbucket Client ID** for your workspace.
- Enter the **Bitbucket Client Secret** for your workspace.
- Enter the **Bitbucket Workspace**, the name of your workspace.
- Set the **Bitbucket Ingest Pull Requests** field to true or false, according
  to your preference. If true, whenever the intergration is run, JupiterOne will
  ingest any PR created or modified in the last 24 hours.

4. Click **Create Configuration** once all values are provided.

### Details on pull request ingestion

Generally, when JupiterOne ingests data from an intregration, any entities not
ingested are deleted from the JupiterOne graph if they exist. For example, if a
Project gets deleted from your Bitbucket account, it will disappear from the
JupiterOne graph the next time the integration runs.

Since Pull Requests are only ingested from the last 24 hours (for performance
reasons), previous Pull Requests in the JupiterOne graph are not deleted. Even
if the PR is deleted from Bitbucket, the JupiterOne integration will have no way
of knowing if the PR was deleted or is merely untouched in the last 24 hours.

That said, if the Repo that owns that Pull Request is deleted from Bitbucket,
the JupiterOne graph will delete the Repo, and then it will delete any orphaned
Pull Request entities that were owned by it. This same "cascading delete" would
apply if higher-level objects (Projects, Workspaces) were deleted from your
Bitbucket account.

# How to Uninstall

1. From the configuration **Gear Icon**, select **Integrations**.
2. Scroll to the **Bitbucket** integration tile and click it.
3. Identify and click the **integration to delete**.
4. Click the **trash can** icon.
5. Click the **Remove** button to delete the integration.

<!-- {J1_DOCUMENTATION_MARKER_START} -->
<!--
********************************************************************************
NOTE: ALL OF THE FOLLOWING DOCUMENTATION IS GENERATED USING THE
"j1-integration document" COMMAND. DO NOT EDIT BY HAND! PLEASE SEE THE DEVELOPER
DOCUMENTATION FOR USAGE INFORMATION:

https://github.com/JupiterOne/sdk/blob/master/docs/integrations/development.md
********************************************************************************
-->

## Data Model

### Entities

The following entities are created:

| Resources              | Entity `_type`          | Entity `_class` |
| ---------------------- | ----------------------- | --------------- |
| Bitbucket Project      | `bitbucket_project`     | `Project`       |
| Bitbucket Pull Request | `bitbucket_pullrequest` | `Review`, `PR`  |
| Bitbucket Repo         | `bitbucket_repo`        | `CodeRepo`      |
| Bitbucket User         | `bitbucket_user`        | `User`          |
| Bitbucket Workspace    | `bitbucket_workspace`   | `Account`       |

### Relationships

The following relationships are created/mapped:

| Source Entity `_type` | Relationship `_class` | Target Entity `_type`   |
| --------------------- | --------------------- | ----------------------- |
| `bitbucket_project`   | **HAS**               | `bitbucket_repo`        |
| `bitbucket_repo`      | **HAS**               | `bitbucket_pullrequest` |
| `bitbucket_user`      | **APPROVED**          | `bitbucket_pullrequest` |
| `bitbucket_user`      | **OPENED**            | `bitbucket_pullrequest` |
| `bitbucket_user`      | **REVIEWED**          | `bitbucket_pullrequest` |
| `bitbucket_workspace` | **HAS**               | `bitbucket_user`        |
| `bitbucket_workspace` | **OWNS**              | `bitbucket_project`     |
| `bitbucket_workspace` | **OWNS**              | `bitbucket_repo`        |

<!--
********************************************************************************
END OF GENERATED DOCUMENTATION AFTER BELOW MARKER
********************************************************************************
-->
<!-- {J1_DOCUMENTATION_MARKER_END} -->
