# OpenCode Session Archive

A small OpenCode Desktop plugin that adds **Archive current session** to the command palette and **⌘⇧M** as its default Mac shortcut. It’s a reference implementation for making the workflow native to Desktop.

Press the shortcut from an idle session, including while the composer has focus. A toast gives you five seconds to click **Undo**. Until then, the session stays open and no archive request is sent. If the timer expires, the plugin rechecks the original session, archives it if it’s still eligible, and closes its tab. Switching tabs doesn’t change the target.

## Try it locally

Requires OpenCode Desktop V2 with GUI plugin support and Bun. The plugin uses the experimental GUI SDK; the repository includes the prebuilt GUI bundle.

```sh
git clone https://github.com/Santiago-j-s/opencode-session-archive.git
cd opencode-session-archive
bun install --frozen-lockfile
pwd
```

Add the absolute path printed by `pwd` to `plugins` in your global OpenCode config (`~/.config/opencode/opencode.json` or `opencode.jsonc`). Keep any existing entries.

```json
{
  "plugins": ["/absolute/path/to/opencode-session-archive"]
}
```

Open an idle session and try **⌘⇧M** or **Archive current session** in the command palette. The binding can be changed in **Settings → Shortcuts**.

## Development

```sh
bun run typecheck
bun run build
```

The build regenerates `gui-experimental.cjs` from `src/gui.ts`.
