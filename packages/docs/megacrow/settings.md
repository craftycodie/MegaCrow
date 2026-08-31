# Settings

Open **Settings** from the toolbar. Options are split into **Compiler** and **Editor** sections. Changes apply immediately and are remembered between sessions.

## Compiler settings

### Gametype Author

Creator name written into the compiled gametype metadata.

| Detail | Value |
|--------|--------|
| Maximum length | 16 characters |
| Default | Empty |

Leave empty if you do not want an author stamped into the file. This is separate from Discord or OS account names.

### Compiler profile

Controls which language extensions the compiler and language service allow.

| Profile | Behavior |
|---------|----------|
| **MegaloEvolved** (default) | Enables MegaloEvolved product extensions on top of stock Megalo |
| **MegaloEdit** | Matches stock MegaloEdit — MegaloEvolved-only language extensions are disabled |

Use **MegaloEdit** when you need scripts and tooling behavior closer to the HREK MegaloEdit compiler.

### Strict compiler

When enabled, the compiler **enforces localization**:

- Quoted string literals in places that expect string-table symbols become **errors** (instead of warnings)
- Missing [`localized_include`](/language/elements/localized-include) files are treated more strictly (aligned with strict localization rules)

When disabled (default), behavior is closer to permissive MegaloEdit-style compiles: literals may warn, and some localization gaps are softer.

For the full Megalo compiler switch model (including temporary overflow and HREK background), see [Compiler settings](/language/compiler-settings) in the language docs. The IDE toggle maps to the localization / string-literal strictness side of that model.

## Editor settings

### Language

Language for the IDE chrome, diagnostics, and hover help.

| Value | Meaning |
|-------|---------|
| **English** | Default UI and messages |
| **日本語** | Japanese UI and compiler/IDE messages |

This also affects which string-table language is preferred when displaying compiled gametype name and description in the sidebar.

### Editor theme

Color theme for the Megalo (Monaco) editor only — not the rest of the IDE chrome.

Available themes include MegaloEvolved Dark, VS Dark, Clouds Midnight, Cobalt2, Dracula, GitHub Dark / Light, Monokai, Night Owl, Nord, Oceanic Next, Solarized Dark / Light, Tomorrow Night, and Twilight.

### Discord rich presence

When enabled, Discord can show that you are editing in MegaloEvolved (for example the current file). Turn off if you do not want editing activity shared on Discord.

| Default | On |
|---------|----|

## Related

- [Workspaces](/megacrow/workspaces) — scripts and output folders (desktop)
- [Export](/megacrow/export) — compile output formats
- [Language compiler settings](/language/compiler-settings) — MegaloCompile switches in depth
