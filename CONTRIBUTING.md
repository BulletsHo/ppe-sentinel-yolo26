# Contributing

1. Create a branch from `main` and describe the behavior you are changing.
2. Keep raw datasets, camera recordings, logs, credentials, and local build output out of commits.
3. Run `npm run privacy:audit`, `npm run build`, and `npm test` before opening a pull request.
4. For model changes, record the dataset source, class mapping, split, device, and evaluation metrics without including private paths.
5. Do not present experimental PPE classes as compliance-certified detection. Include representative negative cases and independent test data.

Dataset maintenance code must preserve ZIP traversal protection, annotation validation, managed-dataset replacement checks, and portable YAML generation.
