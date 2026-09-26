@AGENTS.md

# Smart Resume

## UI rule (hard)

- **Anything that can be built with a shadcn/ui component is built with one.** Buttons, cards, inputs, textareas, labels, badges, toggles, lists (`Item`), empty states (`Empty`), spinners (`Spinner`), alerts, menus, charts (`Chart`), toasts (`sonner`). No hand-rolled equivalents, no raw `<button>`/`<input>`/`<textarea>`.
- Missing component → add it with `pnpm dlx shadcn@latest add <name>`, then use it.
- Use the stock variants and sizes. No one-off color or style overrides on shadcn components; if something needs a new look, change the theme tokens in `src/app/globals.css`.
- Theme: navy + Carolina blue on white (light), midnight blue with Carolina-blue primary (dark). Font: Geist. Colors only via tokens (`primary`, `brand`, `success`, `warning`, `destructive`, `muted`…).
- Raw HTML is fine only for layout (`main`, `section`, `header`, `footer`, grid/flex wrappers) and plain text content (`p`, `ul`/`li` inside a component).
