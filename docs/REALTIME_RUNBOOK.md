# Real-time Trunk runbook

This is the practical watch, test, fix, upload, and merge guide. Run commands
from the repository root.

## What updates in real time?

| Layer        | Input               | Watch here                                | Output                       |
| ------------ | ------------------- | ----------------------------------------- | ---------------------------- |
| Local tests  | Source or test edit | **npm run test:watch**                    | Immediate pass/fail rerun    |
| Code Quality | Changed files       | **trunk check**                           | Findings and proposed fixes  |
| Pull request | Pushed commit       | GitHub Checks or **gh pr checks**         | Live jobs, annotations, logs |
| Merge Queue  | Submitted PR        | Trunk dashboard or **trunk merge status** | Queue lifecycle              |
| Flaky Tests  | JUnit history       | Trunk Uploads and Tests pages             | History and quarantine       |

GitHub Actions and Merge Queue states update live. Flaky Tests processing does
not: allow at least one hour after the first upload, and provide several runs
before expecting useful detection.

## 1. Five-minute local loop

Install once:

```powershell
npm ci
trunk --version
```

If `trunk` is not found, install the official launcher. A repository-local
Windows launcher can be downloaded without administrator access:

```powershell
Invoke-RestMethod -Uri https://trunk.io/releases/trunk.ps1 -OutFile trunk.ps1
.\trunk.ps1 --version
```

With that local launcher, replace `trunk` with `.\trunk.ps1` in direct commands.
The npm quality scripts require the launcher to be available on `PATH`.

Open two PowerShell terminals.

Terminal A continuously reruns affected tests:

```powershell
npm run test:watch
```

Edit **src/cart.ts** or **tests/cart.test.ts**. Vitest prints the result
immediately. Press **q** to stop watch mode.

Terminal B runs focused checks:

```powershell
# Fast project scan; skips only Grype's slower database-backed scan.
npm run quality:fast

# TypeScript correctness only.
trunk check --all --no-fix --filter=oxlint

# Secret and dependency checks only.
trunk check --all --no-fix --filter=trufflehog,osv-scanner
```

### Preview, apply, inspect

```powershell
# Preview without changing files.
trunk check --all --no-fix

# Apply formatting.
npm run format

# Inspect every applied change.
git diff

# Verify the result.
npm test
npm run typecheck
npm run quality:fast
```

**trunk check** targets changed files and can offer fixes interactively.
**trunk check --all --no-fix** is the non-mutating CI-style scan.
**trunk fmt --all** changes files, so inspect **git diff** afterward.

Undo only an unwanted formatter change with:

```powershell
git restore -- path\to\file
```

Do not restore a file containing other work you want to keep.

## 2. Complete local gate

Run before every push:

```powershell
npm test
npm run typecheck
npm run test:report
npm run quality:fast
npm audit --audit-level=high
git diff --check
```

Successful output means:

- Two normal tests pass and the demo flaky test is skipped.
- TypeScript exits without emitting files.
- **test-results/junit.xml** is generated but remains ignored by Git.
- Trunk finds no issue.
- npm finds no high-severity vulnerability.
- Git finds no whitespace error.

Run the slower scanner separately:

```powershell
trunk check --all --no-fix --filter=grype
```

GitHub's Linux runner executes the complete configuration, including Grype.

## 3. Watch a pull request live

### Website

1. Open the pull request and select **Checks**.
2. Open **Tests and types** for Vitest and TypeScript.
3. Open **Trunk Code Quality** for linters and scanners.
4. Expand a failed step and follow its annotation to the exact file and line.

Completed example:
<https://github.com/LakshayKhattar/trunk-playground/pull/1>

### GitHub CLI

```powershell
# Live summary until all PR checks finish.
gh pr checks PR_NUMBER --repo LakshayKhattar/trunk-playground --watch --interval 10

# Find recent Quality runs.
gh run list --repo LakshayKhattar/trunk-playground --workflow Quality --limit 5

# Stream a run; fail the command when CI fails.
gh run watch RUN_ID --repo LakshayKhattar/trunk-playground --exit-status

# Print only failed logs.
gh run view RUN_ID --repo LakshayKhattar/trunk-playground --log-failed
```

Replace **PR_NUMBER** with the open PR number and **RUN_ID** with the ID printed
by **gh run list**.

### Fix and apply loop

1. Reproduce the exact failed command locally.
2. Change the smallest relevant file.
3. Rerun the focused check.
4. Run the complete local gate.
5. Commit and push.
6. Watch checks for the new commit.

Confirm the SHA shown on the PR. A green older commit does not prove that the
newest commit is green.

## 4. Exercise Flaky Tests end to end

Hosted uploads require the secrets in **HOSTED_SETUP.md**. Manual dispatch is
available after this workflow exists on the default branch.

### Local demonstration without secrets

```powershell
$env:RUN_FLAKY_DEMO = "true"

# Passing sample.
$env:DEMO_FLAKE_SHOULD_FAIL = "false"
npm run test:report

# Intentionally failing sample. Red output is expected.
$env:DEMO_FLAKE_SHOULD_FAIL = "true"
npm run test:report

Remove-Item Env:RUN_FLAKY_DEMO
Remove-Item Env:DEMO_FLAKE_SHOULD_FAIL
```

Both runs use the same test identity in **test-results/junit.xml**, but have
different outcomes. That stable identity lets Trunk build failure history.

### Trigger and watch hosted uploads

```powershell
# Queue passing and intentionally failing samples.
gh workflow run "Flaky Tests Lab" --repo LakshayKhattar/trunk-playground -f simulate_failure=false
gh workflow run "Flaky Tests Lab" --repo LakshayKhattar/trunk-playground -f simulate_failure=true

# Locate and watch the runs.
gh run list --repo LakshayKhattar/trunk-playground --workflow "Flaky Tests Lab" --limit 5
gh run watch RUN_ID --repo LakshayKhattar/trunk-playground
```

Repeat pass, fail, pass, fail. Before quarantine, a failure should leave the
job red. After Trunk recognizes and quarantines the matching failure, rerun the
failure and inspect whether it is reported without blocking CI.

Watch these Trunk pages:

1. **Uploads** confirms CI and JUnit arrived.
2. **Tests** shows pass/fail history for the stable test name.
3. Test details show fingerprints, branches, owners, and source links.
4. Quarantine shows whether the matching failure may block CI.
5. Jira, Linear, Slack, or webhooks show optional downstream automation.

If data does not appear, inspect the uploader step, confirm secret names with
**gh secret list**, wait at least an hour after the first upload, and upload
multiple runs. Never print secret values.

## 5. Exercise Merge Queue end to end

Complete the GitHub App, queue, and branch-protection steps in
**HOSTED_SETUP.md**, then authenticate:

```powershell
trunk login
```

Submit and observe a PR:

```powershell
# Submit at default priority.
trunk merge PR_NUMBER

# Queue snapshot and one PR's timeline.
trunk merge status
trunk merge status PR_NUMBER

# Remove it before making more changes.
trunk merge cancel PR_NUMBER
```

Other entry points:

- Comment **/trunk merge** on the GitHub pull request.
- Comment **/trunk cancel** to remove it.
- Apply the enqueue label configured in Trunk.
- Use the Trunk GitHub browser extension.

Priority examples:

```powershell
trunk merge PR_NUMBER -p 10   # High
trunk merge PR_NUMBER -p 100  # Default
trunk merge PR_NUMBER -p 200  # Low
```

Priority 0 is urgent and interrupts active testing. Reserve it for a real
emergency because interrupted PRs must restart.

### Watch queue behavior

In **Trunk -> Merge Queue -> trunk-playground**, inspect:

- **Queue** for testing, waiting, merged, and failed PRs.
- **Graph** for dependencies, parallel lanes, batches, and bisection.
- **PR details** for readiness requirements and test links.
- **Health** for success rate, throughput, and time-in-queue.
- GitHub's **Trunk Merge Queue (main)** check.

Normal lifecycle:

```text
Queued -> Pending -> Testing -> Tests Passed -> Merged
                         |
                         +-> Pending Failure -> Failed or retested
```

If a PR stays Queued, inspect branch protection, required checks, merge
conflicts, target branch, and impacted-target uploads in parallel mode.

### Queue experiments

1. **Normal path**: submit one green PR and watch it merge.
2. **Parallel lanes**: submit two PRs changing unrelated files.
3. **Serialization**: submit two PRs changing the same target or file.
4. **Batching**: submit compatible PRs and inspect the batch node.
5. **Bisection**: make one PR fail in a batch and watch isolation.
6. **Priority**: submit a mock hotfix with priority 10.
7. **Recovery**: cancel, correct, push, and resubmit a failed PR.

Admins can stop and restart processing during a CI incident:

```powershell
trunk merge pause
trunk merge resume
```

## 6. Input-to-output map

```text
edit files
  -> local Vitest and Trunk feedback
  -> git diff review
  -> commit and push
  -> GitHub tests and Trunk annotations
  -> JUnit upload and Flaky Tests history
  -> Merge Queue proposed-main test
  -> merge only after required checks pass
```

Remember:

- Formatters may modify files; checks and dashboards normally do not.
- JUnit uploads carry test metadata and results, not repository secrets.
- Quarantine changes whether a matching flaky failure blocks CI. The test still
  runs and keeps collecting evidence.
- Merge Queue tests a proposed landing state; it does not replace review or
  required checks.
- Emergency and force-merge controls weaken normal safeguards intentionally.

## Completion checklist

- [ ] Local watch mode reacts to an edit.
- [ ] The complete local gate passes.
- [ ] PR checks are green for the latest commit.
- [ ] Trunk receives several alternating demo results.
- [ ] The demo test history appears after processing.
- [ ] A normal PR travels through Merge Queue and merges.
- [ ] Cancel and resubmit work.
- [ ] No token value appears in code, logs, issues, or pull requests.
