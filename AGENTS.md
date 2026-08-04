# Repository instructions

## Quality checks

- Run `npm test` and `npm run typecheck` after changing TypeScript.
- Run `trunk check -y` after changing code or configuration.
- Run `trunk fmt --all` when only formatting is needed.
- In a network-isolated Codex environment, pre-install Trunk dependencies with
  `trunk install`. If that is not possible, run the npm checks and let the
  GitHub `Trunk Code Quality` job perform the full scan.
- Review all automatic fixes before committing them.
