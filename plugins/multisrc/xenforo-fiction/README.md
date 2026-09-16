# XenForo Fiction multisrc generator

## Compatibility

For XenForo forums that use threadmarks as their chapter-list feature —
currently SpaceBattles and SufficientVelocity. A thread is a novel; a
threadmark is a chapter.

## Add a new source

Add an entry to `sources.json`:

- `id`: unique source id, lowercase, no spaces.
- `sourceSite`: the site's base URL, with a trailing slash.
- `sourceName`: display name used to derive the generated filename.
- `options.discoveryNode`: the forum-listing path (with trailing slash)
  `popularNovels`/`searchNovels` browse for new threads, e.g.
  `forums/creative-writing.18/`.

Only threads that use XenForo threadmarks are supported — see the design
spec (`docs/superpowers/specs/2026-09-16-xenforo-fiction-lnreader-plugin-design.md`
in the parent monorepo) for why quests, login-walled sites, and
non-threadmarked threads are out of scope.
