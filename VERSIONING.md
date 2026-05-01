# Semantic Versioning Policy

This project follows [Semantic Versioning 2.0.0](https://semver.org/) using the `major.minor.patch` format.

## Versioning Rules

- Increment `major` for incompatible API or behavior changes.
- Increment `minor` for backward-compatible functionality additions.
- Increment `patch` for backward-compatible bug fixes.

## Pre-release Tags

For internal testing and release validation, use:

- `vX.Y.Z-alpha.N` for internal alpha testing
- `vX.Y.Z-beta.N` for beta testing

Examples:

- `v1.4.0-alpha.1`
- `v1.4.0-alpha.2`
- `v1.4.0-beta.1`

## Release Commands

Run these from the project root:

- `npm run version:patch`
- `npm run version:minor`
- `npm run version:major`
- `npm run version:alpha`
- `npm run version:beta`

These commands update `package.json` version and create a matching git tag with the `v` prefix.
