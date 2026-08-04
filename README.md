# Trunk Platform Playground

A hands-on, public sandbox for exploring
[Trunk](https://docs.trunk.io/) without using the Visual Alpha organization.
It demonstrates the three main Trunk products:

- **Code Quality**: local linting, formatting, security scans, actions, Git
  hooks, and GitHub annotations.
- **Flaky Tests**: JUnit generation, result uploads, detection, quarantine, and
  a controlled pass/fail experiment.
- **Merge Queue**: CI triggers and a setup checklist ready for Trunk's GitHub
  App, protected branches, batching, and parallel queues.

The repository is public so it stays inside Trunk's free tier. See
[the complete feature guide](docs/FEATURES.md) for examples and
[the hosted setup guide](docs/HOSTED_SETUP.md) for the one-time account steps.

## Quick start

You need Node.js 20 or newer and the
[Trunk launcher](https://docs.trunk.io/code-quality/overview/getting-started/install).

```bash
npm install
npm test
npm run typecheck
trunk check --all
```

On Windows PowerShell, Trunk also documents a repository-local launcher:

```powershell
Invoke-RestMethod -Uri https://trunk.io/releases/trunk.ps1 -OutFile trunk.ps1
.\trunk.ps1 check --all
```

Do not commit `trunk.ps1`; the repository already stores the actual Trunk
configuration in `.trunk/trunk.yaml`.

## Try these examples

```bash
# Scan only changed files and offer fixes.
trunk check

# Scan every file without changing anything.
trunk check --all --no-fix

# Run only security-oriented checks.
trunk check --all --filter=trufflehog,osv-scanner,checkov,grype

# Format all supported files.
trunk fmt --all

# Run the custom repository action from .trunk/trunk.yaml.
trunk run verify-project

# Inspect every resolved linter, action, runtime, and setting.
trunk config print
```

## Repository map

| Path                                    | Purpose                                            |
| --------------------------------------- | -------------------------------------------------- |
| `.trunk/trunk.yaml`                     | Versioned linters, scanners, runtimes, and actions |
| `.github/workflows/quality.yml`         | Tests plus full Trunk Code Quality CI              |
| `.github/workflows/flaky-tests-lab.yml` | Manual controlled-flake experiment                 |
| `tests/flaky-demo.test.ts`              | Opt-in test that can alternate pass/fail           |
| `docs/FEATURES.md`                      | Feature catalog with multiple examples             |
| `docs/HOSTED_SETUP.md`                  | Trunk account, secrets, app, and queue checklist   |

## Safe defaults

The normal test command skips the controlled flaky test, so regular CI stays
green. The flaky experiment runs only through a manual workflow. No Trunk API
token, organization slug, or billing details are committed to the repository.
