# Repository Guidelines

## Project Structure & Module Organization
The root workspace pairs orchestration assets (`docker-compose.yml`, `Dockerfile`, `n8n-setup.js`) with `custom-nodes/`, where each node ships as its own package. Each package keeps `package.json` at the root, TypeScript in `nodes/`, optional credentials under `credentials/`, and builds in `dist/`; keep icons and helpers local to the package so the repository root stays clean.

## Build, Test, and Development Commands
Run `pnpm install` once per package, then `pnpm build` for TypeScript plus icon output or `pnpm dev` for watch mode. Use `pnpm lint` or `pnpm lintfix` to apply the n8n ESLint rules and `pnpm format` before commits. Start the stack with `docker compose up -d` at the repo root and execute `node n8n-setup.js` after each build to sync code into the container.

## Coding Style & Naming Conventions
Stick to tabs, single quotes, and explicit exported types. The node class name must match its filename (`Firecrawl` in `Firecrawl.node.ts`); properties use camelCase and description defaults should mirror UI labels. Keep lint suppressions local and factor helpers when operations grow complex.

## Node Implementation Essentials
Every node exports an `INodeType` with a `description` covering `displayName`, `name`, `icon`, `group`, `version`, `defaults`, `inputs`, `outputs`, plus `requestDefaults` for HTTP work. Decide early between declarative routing and programmatic `execute()` flows; share parameters through `Resource` and `Operation` pairs so user input persists when switching actions. Credential classes belong in `<CredentialName>.credentials.ts`, and their exported `name` must match the entries listed in `description.credentials`.

## Testing Guidelines
Exercise new features inside n8n with sample workflows, storing useful exports under `n8n-data/`. Before a PR run `pnpm build && pnpm lint`, verify execution at `http://localhost:5678`, and document manual steps or fixtures so reviewers can reproduce them quickly.

## Commit & Pull Request Guidelines
Write imperative, scoped commits consistent with the current history (`run fix`, `removed unnecessary files`). Pull requests should summarize changes, list verification commands, link issues, and attach screenshots or workflows when behavior, credentials, or UI shifts occur. Flag dependency bumps and breaking schema updates explicitly.

## Docker & Environment Tips
If containers drift, run `docker compose down && docker compose up -d`, then re-run `node n8n-setup.js` to rebuild symlinks or clear permission issues. Keep dependencies lean—everything declared in `custom-nodes/*/package.json` installs inside the container automatically.


## IMPORTANT

- always remember to include new files to the TSConfig.

- refer to: https://github.com/ivov/eslint-plugin-n8n-nodes-base/tree/master/docs/rules for rules.