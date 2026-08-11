# Security Policy

## Supported versions

The `main` branch and the latest tagged release receive security fixes. Older desktop artifacts may contain obsolete dependencies and should be upgraded.

## Reporting a vulnerability

Do not open a public issue containing credentials, private URLs, camera frames, or an exploit. Use a private GitHub security advisory for this repository, or contact the repository maintainers through their configured private channel. Include the affected version, deployment mode, reproduction steps, and the minimum evidence needed to verify the report.

Never upload `.env`, detection logs, raw camera recordings, or private datasets in a report.

## Deployment requirements

- Keep `PPE_PUBLIC` disabled for local-only use.
- Public deployments must set both `PPE_USERNAME` and a long random `PPE_PASSWORD`.
- Use HTTPS for remote browser camera access.
- Keep the dataset registry and log directories outside any public static directory.
- Run `npm run privacy:audit` before publishing a model or release artifact.
