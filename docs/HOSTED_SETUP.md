# Hosted Trunk setup

The repository code is complete without a Trunk account. These one-time steps
connect the hosted dashboard, Flaky Tests, and Merge Queue. They require an
interactive sign-in because GitHub and Trunk must ask you to approve app
permissions and because the API token must remain private.

## 1. Connect only this personal repository

1. Sign in at <https://app.trunk.io/login> with `LakshayKhattar`.
2. Create a Trunk organization for your personal account.
3. Start the GitHub App installation **from the Trunk web app**. Trunk's docs
   warn that starting directly from GitHub will not associate the installation
   with the Trunk organization correctly.
4. Choose **Only select repositories** and select
   `LakshayKhattar/trunk-playground`.

This keeps the experiment completely outside the Visual Alpha organization.

## 2. Enable Flaky Tests uploads

In Trunk, open **Settings -> Organization -> General** and copy:

- The organization URL slug.
- The organization API token, not a project token.

Add them as GitHub Actions secrets. Never paste the token into a commit,
issue, pull request, or chat message.

```bash
gh secret set TRUNK_ORG_URL_SLUG --repo LakshayKhattar/trunk-playground
gh secret set TRUNK_API_TOKEN --repo LakshayKhattar/trunk-playground
```

Each command prompts securely for its value. Confirm only the secret names:

```bash
gh secret list --repo LakshayKhattar/trunk-playground
```

### Controlled detection experiment

Open **Actions -> Flaky Tests Lab -> Run workflow** and run the same test at
least four times:

1. `simulate_failure = false`
2. `simulate_failure = true`
3. `simulate_failure = false`
4. `simulate_failure = true`

The test name remains stable while its outcome alternates. In Trunk, inspect
**Uploads**, **Tests**, and the test's failure history. Then try:

- Marking or confirming it as flaky.
- Quarantining it and rerunning the failing case.
- Pinning a critical test so it can never be quarantined.
- Viewing the direct GitHub workflow link and PR summary.

The workflow uses Trunk's single-step `run` mode. An unquarantined failure
blocks the job; a matching quarantined failure can be reported without
blocking it.

## 3. Create a Merge Queue

1. In Trunk, open **Merge Queue** and choose **Create New Queue**.
2. Install or confirm the Trunk GitHub App when prompted.
3. Select `LakshayKhattar/trunk-playground` and target `main`.
4. Keep squash merge as the first experiment.
5. In GitHub branch protection or a ruleset for `main`:
   - Require a pull request.
   - Require `Tests and types` and `Trunk Code Quality`.
   - Allow the `trunk-io` app to push to the protected branch.
   - Do **not** require branches to be up to date before merging.
   - Exclude `trunk-temp/**/*` and `trunk-merge/**/*` from wildcard rules.

The quality workflow already runs for pull requests and Trunk's temporary
branch patterns.

### Queue experiments

Create two small pull requests that edit different files, submit both to the
queue, and observe independent lanes. Then try:

- A pair of PRs editing the same file to see conflict serialization.
- Batching two compatible PRs.
- A deliberately failing PR to see isolation or bisection behavior.
- Priority submission for a mock hotfix.
- Cancel, resubmit, pause, and resume from the dashboard or CLI.

Do not enable force merge or emergency bypass until the normal queue succeeds.

## 4. Optional hosted Code Quality metrics

The GitHub Action provides annotations without a Trunk token. To upload full
Code Quality metrics to Trunk, create a repository token in the Trunk web app,
store it as a GitHub secret, and pass it to `trunk-io/trunk-action` as its
`trunk-token` input. This is deliberately not enabled by default because the
repository does not need a secret merely to lint pull requests.

## 5. Removal and cleanup

The setup is reversible:

1. Delete the two repository secrets.
2. Delete or disable the queue in Trunk.
3. Remove `trunk-playground` from the Trunk GitHub App installation.
4. Delete the personal Trunk organization if you no longer want its retained
   test results.
