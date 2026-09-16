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

Published by running `npm run publish:plugins` locally from a checkout of
this repo, whenever you want to push a new version of the plugins to the
`plugins/v1.0.0` branch the app reads from. This builds, compiles, and
generates the manifest, then force-pushes the result to that branch and
switches back to `master`.

`.github/workflows/publish-plugins.yml` (inherited from upstream
`lnreader-plugins`, unmodified) is left in the repo but isn't the active
publishing mechanism here — it would need a `REPO_SCOPED_TOKEN` repository
secret configured to run, which this repo doesn't have set up.

Forked from [lnreader/lnreader-plugins](https://github.com/lnreader/lnreader-plugins)
(MIT licensed — see `LICENSE`), stripped down to just the plugins above.
