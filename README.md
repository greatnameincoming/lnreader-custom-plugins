# lnreader-custom-plugins

Personal [LNReader](https://github.com/LNReader/lnreader) plugin repository.

[![Add to LNReader](https://img.shields.io/badge/LNReader-Add%20Repository-blue)](lnreader://repo/add?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgreatnameincoming%2Flnreader-custom-plugins%2Fplugins%2Fv1.0.0%2F.dist%2Fplugins.min.json)

Tap the badge above on a device with LNReader installed, or add this URL
manually under LNReader's repository settings:

```
https://raw.githubusercontent.com/greatnameincoming/lnreader-custom-plugins/plugins/v1.0.0/.dist/plugins.min.json
```

## Plugins

- **SpaceBattles** — reads Creative Writing forum threads via threadmarks.
- **SufficientVelocity** — reads User Fiction forum threads via threadmarks.

Quests, QuestionableQuesting, and non-threadmarked threads are not
supported. See `plugins/multisrc/xenforo-fiction/README.md` for the
generator this is built from.

## Publishing

Pushing to `master` triggers `.github/workflows/publish-plugins.yml`
(inherited from upstream `lnreader-plugins`, unmodified), which builds and
publishes the `plugins/v1.0.0` branch this repository's manifest lives on.
Requires a `REPO_SCOPED_TOKEN` repository secret (a GitHub PAT with
contents-write access) to be configured once in this repo's GitHub
settings.

Forked from [lnreader/lnreader-plugins](https://github.com/lnreader/lnreader-plugins)
(MIT licensed — see `LICENSE`), stripped down to just the plugins above.
