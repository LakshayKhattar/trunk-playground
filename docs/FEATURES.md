# Trunk feature guide

This guide separates what is runnable in this pull request from what becomes
available after connecting the hosted Trunk account. It follows Trunk's
documentation index and billing page as of August 2026.

## Free-tier boundary

This public repository is designed to remain free:

| Product      | Documented free allowance                                                    |
| ------------ | ---------------------------------------------------------------------------- |
| Code Quality | Unlimited quality and security metrics                                       |
| Merge Queue  | Unlimited merged PRs; public-repo contributors do not count as private seats |
| Flaky Tests  | Up to 5 million test spans per month                                         |
| Users        | Unlimited contributors on public repositories                                |

For private repositories, the free plan is limited to five monthly active
committers, and Flaky Tests still has the 5-million-span monthly limit.

## 1. Code Quality CLI

### What it covers

Trunk is a meta-linter: one versioned config installs and runs formatters,
linters, IaC scanners, dependency scanners, and secret scanners across many
languages. This repository enables:

| Tool                          | Demonstrates                                               |
| ----------------------------- | ---------------------------------------------------------- |
| `prettier`                    | Consistent TypeScript, JSON, Markdown, and YAML formatting |
| `oxlint`                      | Fast JavaScript and TypeScript correctness checks          |
| `markdownlint` and `yamllint` | Documentation and workflow style checks                    |
| `actionlint`                  | GitHub Actions syntax and expression checking              |
| `git-diff-check`              | Conflict markers and whitespace mistakes                   |
| `trufflehog`                  | Accidental credential detection                            |
| `osv-scanner` and `grype`     | Known dependency and filesystem vulnerabilities            |
| `checkov`                     | CI and infrastructure-as-code security checks              |

Trunk supports more than 100 tools; the point of this list is to cover several
categories without turning a tiny project into a multi-language monorepo.

### Check examples

```bash
# Default: check changes relative to main and interactively offer fixes.
trunk check

# CI-style full repository scan.
trunk check --all --no-fix

# Apply all safe fixes without prompting.
trunk check --all -y

# One category or one tool at a time.
trunk check --all --filter=oxlint
trunk check --all --filter=trufflehog

# Everything except expensive or network-sensitive scanners.
trunk check --all --filter=-trufflehog,-grype

# Verify that each enabled linter can execute on a sample file.
trunk check --sample=2

# Machine-readable results for another tool or agent.
trunk check --all --output=json --output-file=.demo/results.json
```

Other useful modes include checking staged/indexed files, a specific commit,
or a pre-push commit range; setting a different upstream; controlling parallel
jobs; bypassing the cache; and showing pre-existing issues. Run
`trunk check --help` for the exact flags supported by the pinned CLI.

### Formatting examples

```bash
# Format changed files.
trunk fmt

# Format the whole repository.
trunk fmt --all

# Preview findings without accepting fixes.
trunk check --all --no-fix --filter=prettier
```

### Hold the line

On an older codebase, Trunk can distinguish existing findings from new ones so
a team can block regressions without fixing the entire backlog first. The
GitHub Action supports `check-all-mode: hold-the-line` when a token and previous
upload are available. This clean playground instead scans everything.

### Configuration, plugins, runtimes, and tools

`.trunk/trunk.yaml` pins the CLI, plugin source, runtime versions, linters, and
actions. Useful inspection and maintenance commands include:

```bash
trunk config print
trunk check list
trunk check enable <linter>
trunk check disable <linter>
trunk install
trunk upgrade
trunk tools list
```

You can override built-in definitions, add a custom linter with regex or SARIF
output, load a local or public plugin, share exported configs between repos,
and set per-user overrides without changing the team config.

### Trunk Actions and Git hooks

Actions can run manually, on a schedule, when files change, or from Git hooks.
This repository enables built-in pre-commit formatting, pre-push checking,
upgrade notifications, and a custom `verify-project` action.

```bash
trunk actions list
trunk run verify-project
trunk actions history verify-project
trunk actions disable trunk-fmt-pre-commit
trunk actions enable trunk-fmt-pre-commit
```

A second custom action could be added like this:

```yaml
actions:
  definitions:
    - id: changed-docs
      display_name: Check documentation when it changes
      run: trunk check --filter=markdownlint ${target}
      triggers:
        - files: ["docs/**", "README.md"]
```

Actions also support managed Node and Python runtimes, package files, working
directories, arguments, interactive manual or hook execution, schedules, and
terminal or VS Code notifications.

### IDE, single-player, and AI-agent use

- The VS Code extension can surface issues and fixes while editing.
- `trunk init --single-player-mode` keeps `.trunk` in `.git/info/exclude` for a
  private experiment; `trunk config share` later makes it team-visible.
- `AGENTS.md` teaches Codex which checks to run.
- Trunk recommends pre-installing dependencies with `trunk install` in
  network-isolated agent environments.

## 2. Code Quality in GitHub Actions

`.github/workflows/quality.yml` runs regular tests and
`trunk-io/trunk-action@v1`. The action can:

- Annotate changed lines and create a named status check.
- Cache downloaded tools and prior results.
- Auto-detect PR, push, all-files, and Trunk merge modes.
- Save annotations as an artifact for untrusted fork PRs.
- Upload quality and security metrics when a Trunk token is supplied.
- Run setup dependencies and use a repository-provided launcher if required.

The included workflow intentionally needs no Trunk secret for basic CI.

## 3. Flaky Tests

### Data ingestion and detection

Trunk accepts JUnit XML, Apple XCResult, and Bazel BEP output from GitHub
Actions, GitLab, Buildkite, CircleCI, Jenkins, and other CI systems. Detection
is branch-aware: stable branches, PRs, and merge branches contribute different
signals. Failure modes are fingerprinted so distinct causes can be triaged.

This repo generates `test-results/junit.xml` and uploads it through
`trunk-io/analytics-uploader@v2` after the two required secrets are configured.

```bash
# Normal report; the demo test is skipped.
npm run test:report

# Passing occurrence of the demo test (PowerShell).
$env:RUN_FLAKY_DEMO = "true"
$env:DEMO_FLAKE_SHOULD_FAIL = "false"
npm run test:report

# Failing occurrence of the same test.
$env:DEMO_FLAKE_SHOULD_FAIL = "true"
npm run test:report
```

Use the manual workflow for real uploads; local commands are for seeing the
JUnit behavior without consuming hosted test spans.

### Dashboard and management

After several uploads, explore:

- Upload validation, warnings, test inventory, history, and health trends.
- Flake status, owners, notes, impact, and recurring failure signatures.
- Pull-request comments that distinguish known flakes from new failures.
- Quarantine policies so a known matching failure does not block CI.
- Never-quarantine or pinned tests for business-critical coverage.
- Infrastructure-failure protection so a CI outage is not misclassified as
  hundreds of flaky tests.

Quarantined tests continue running and producing evidence; they are not simply
deleted from the suite.

### Automation and integrations

Trunk provides automatic ticketing for Jira and Linear, webhook recipes for
GitHub Issues, Slack, Microsoft Teams, Jira, and Linear, plus an API and
Analytics CLI. The Flaky Tests MCP server can give Codex, Claude, Cursor,
Gemini, or Copilot the failure context needed to investigate and propose a
fix. Agentic autofix is a hosted account feature, not simulated by this repo.

## 4. Merge Queue

### Core behavior

The queue tests a proposed landing state before merging. Compared with a
single serial lane, Trunk can use impacted-target information to run unrelated
PRs in parallel. It can batch compatible PRs and bisect a failing batch to find
the offender.

The required hosted setup is documented in `HOSTED_SETUP.md`. The repository's
CI already covers PRs plus `trunk-merge/**` and `trunk-temp/**` branches.

### Features to explore

| Area             | Examples                                                         |
| ---------------- | ---------------------------------------------------------------- |
| Submission       | Dashboard checkbox, label, browser extension, CLI, or API        |
| Queue control    | Submit, cancel, pause, resume, reprioritize, monitor             |
| Throughput       | Parallel lanes, batching, automatic bisection                    |
| Target awareness | Bazel, Nx, Gradle, or custom impacted-target API                 |
| Flake handling   | Anti-flake protection and pending-failure depth                  |
| Urgent work      | Priority merging, emergency PRs, and admin force merge           |
| Administration   | Multiple branch queues, timeouts, concurrency, merge method      |
| Operations       | Metrics, webhook events, Slack notifications, Terraform provider |

Start with one protected `main` queue. Emergency and force-merge paths bypass
normal safeguards and should be tried only after the normal path works.

### Example daily workflow

1. Open a PR and wait for `Tests and types` plus `Trunk Code Quality`.
2. Submit it to Trunk Merge Queue.
3. Trunk creates a temporary tested landing state.
4. GitHub Actions run for that state.
5. Trunk merges if the required checks pass, or reports and isolates failures
   if they do not.

## 5. Platform APIs, webhooks, and security

Trunk exposes authenticated APIs for Merge Queue and Flaky Tests, and webhook
events that can be transformed through Svix. Never hard-code an API token:

```bash
# Illustrative only. Put the real URL from the current API docs in a script,
# and load the token from a secret manager or environment variable.
curl --request GET \
  --header "Authorization: Bearer $TRUNK_API_TOKEN" \
  "https://api.trunk.io/<documented-endpoint>"
```

The placeholder is deliberate so an old endpoint is never presented as a
copy-and-paste-safe current API. Consult Trunk's OpenAPI spec at
<https://docs.trunk.io/openapi.json>.

Trunk documents SOC 2 Type II controls, TLS and HSTS in transit, AES-256 at
rest, MFA, least privilege, audit logging, US-hosted AWS infrastructure, and
45-day test-result retention. Review the GitHub App permissions before
installation and grant access only to this playground repository.

## 6. Suggested learning sequence

1. Run tests, type checking, `trunk check`, filters, JSON output, and autofix.
2. Try formatting and the custom action; inspect action history and hooks.
3. Review the GitHub Action annotations on the implementation PR.
4. Connect the personal Trunk organization and add Flaky Tests secrets.
5. Alternate the controlled flaky workflow and test quarantine behavior.
6. Protect `main`, create the Merge Queue, and submit two independent PRs.
7. Only then explore batching, failure isolation, priority, webhooks, and APIs.

This order exercises the broad platform while keeping every destructive or
secret-bearing step explicit and reversible.
