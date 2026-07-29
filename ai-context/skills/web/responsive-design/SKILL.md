---
name: responsive-design
description: >-
  Responsive / mobile-friendly design for the Aspect web app (React 17 + MUI v5).
  Use when adapting desktop-only UI to mobile or tablet: hamburger navigation,
  breakpoints, drawers, responsive tables/forms/filters. Core rule: the desktop view must
  remain unchanged (or change minimally) — mobile adaptations are additive.
---

# Responsive Design (Mobile-Friendly Aspect)

Aspect is a desktop-first SPA being incrementally adapted for mobile as part of a
mobile-friendliness epic. **First deliverable: hamburger navigation menu.**

## Non-negotiable principles

1. **Desktop stays as-is.** Never restructure or restyle existing desktop UI to make
   mobile work. Mobile behavior is layered on via breakpoints — at `md` and up, the UI
   must render pixel-identical to today.
2. **No deep changes to Aspect design guidelines without discussion.** Do not edit
   `web/src/theme/index.js`, `web/src/theme/variables.css`, or `web/src/theme/colors.js`
   beyond additive tokens. Flag any guideline-level change for human review first.
3. **Additive, not transformative.** Prefer conditionally rendering a mobile variant
   next to the desktop one over rewriting shared components.
4. **Permissions are identical on mobile.** Every nav item / action must stay wrapped in
   `PermissionChecker` exactly as on desktop (see
   `ai-context/skills/authentication-authorization/SKILL.md`).

## Breakpoints

Use MUI's default breakpoints — do not invent custom pixel values:

| Key | Width    | Treatment                              |
| --- | -------- | -------------------------------------- |
| xs  | 0–599    | Mobile — hamburger nav, stacked layout |
| sm  | 600–899  | Mobile/tablet — hamburger nav          |
| md  | 900–1199 | Desktop — existing UI unchanged        |
| lg+ | 1200+    | Desktop — existing UI unchanged        |

**`md` is the desktop/mobile boundary.** Below `md` → mobile variant; `md` and up →
existing desktop UI.

### In JSX (preferred for swapping whole components)

```jsx
import { useMediaQuery, useTheme } from '@mui/material'

const theme = useTheme()
const isMobile = useMediaQuery(theme.breakpoints.down('md'))

return isMobile ? <MobileNavigation /> : <DesktopNavigation />
```

### In CSS Modules (preferred for show/hide and layout tweaks)

```css
/* Desktop default — leave existing rules untouched */
.Navigation__horizontal {
  display: block;
}
.HamburgerButton {
  display: none;
}

@media (max-width: 899.95px) {
  .Navigation__horizontal {
    display: none;
  }
  .HamburgerButton {
    display: inline-flex;
  }
}
```

Use `899.95px` (MUI's `breakpoints.down('md')` equivalent) so CSS and
`useMediaQuery` agree.

### In `sx` props (for small MUI-only tweaks)

```jsx
<IconButton sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
```


### Required approach

1. **Reuse `getRawLinks`** — export it (or extract to a shared module in the same
   folder) so desktop and mobile menus can never drift. Do not duplicate the link list.
2. Build a `LoggedInLayout.MobileNavigation.jsx` using **MUI `Drawer`**
   (`anchor="left"`, temporary variant) opened by a hamburger `IconButton`
   (`MdMenu` from `react-icons/md` — this project uses react-icons, not
   `@mui/icons-material`).
3. Render submenus as **collapsible `List` sections** (`Collapse` + expand caret),
   not popover `Menu`s — popovers are poor UX in a drawer.
4. Close the drawer on navigation (route link click) and on backdrop click.
5. Preserve active-link highlighting (compare `useLocation().pathname` like
   `itemSelected` / `submenuSelected` do today).
6. Keep the user `IconMenu` (account/sign-out) in the AppBar on mobile, or move it
   into the drawer footer — but do not drop it.
7. Desktop (`md`+): hamburger hidden, horizontal nav identical to today.

### Accessibility

- Hamburger button: `aria-label` (i18n'd), `aria-expanded`, `aria-controls`.
- Drawer traps focus by default (MUI handles this); return focus on close.
- Touch targets ≥ 44×44px in the drawer.

## Filters (mobile-friendly)

Filters are the next deliverable after navigation. Today they are **desktop-only** and
break on small screens. This section is the canonical guide for fixing them.

### How filters are built today (read this first)

- **One wrapper, many filter sets.** `web/src/components/Filter/FilterContainer.jsx` is the
  shared shell. Each page has its own `FilterContainer.<Domain>.jsx` (e.g.
  `FilterContainer.Result.jsx`, ~22 of them) that passes filter inputs as `children`.
- **The shell already has a read view and an edit view** — don't reinvent them:
  - **Read view** = applied-filter **chips** rendered by `FilterContainer.Buttons.jsx`
    (`FilterButtons`), each removable via an `MdClose` button.
  - **Edit view** = the inputs, revealed by an MUI `Collapse` toggled by the
    up/down arrow button, with `Cancel` / `Apply` in `CardActions`.
- **State**: `useFilterSync()` (local edit state) → `Apply` calls `addFilter()` →
  `FilterProvider` context (per-`pathname`) → page reads via `usePathFilter()` /
  `useFilterValues()` → React Query refetch. Filters are **not** in the URL.
- **Layout** (the actual problem): every input is wrapped in a hard-coded
  `<Grid item xs={3}>`. `xs` applies at *all* widths, so filters stay locked at 4 columns
  (25% each) on phones — unusable. The chips row and the toggle button sit in a
  `display: flex; justify-content: space-between` `CardContent` that also overflows.

### What to change (in priority order)

**1. Responsive grid — the core fix (DONE).** The fixed `xs={3}` (and the one `xs={4}`)
across all 20 `FilterContainer.<Domain>.jsx` files have been converted to responsive spans so
fields stack on mobile, go 2-up on tablet, and stay **pixel-identical on desktop**:

```jsx
// Before:  <Grid item xs={3}>
// After:   <Grid item xs={12} sm={6} md={3}>
```

`md={3}` is 25% at `md`+ — exactly today's desktop layout (principle #1 holds). `xs={12}`
= full-width stack on phones; `sm={6}` = 2 columns on tablet. The same mapping applies to
`xs={4}` (→ `xs={12} sm={6} md={4}`).

**When adding new filter fields, use the responsive form directly** — `xs={12} sm={6} md={N}`,
never a bare `xs={N}`. Empty spacer items must be hidden on mobile so they don't add blank
rows: `<Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }} />`.

The shell (`FilterContainer.jsx`) `cardContentStyle` now sets `flexWrap: 'wrap'` + `gap` so
the read-view chips and the toggle button wrap instead of overflowing on narrow screens
(desktop is unaffected — nothing wraps when there's room).

If you prefer a single source of truth for new code, a tiny wrapper is optional:

```jsx
// FilterContainer.GridItem.jsx
const FilterGridItem = ({ span = 3, children, ...rest }) => (
  <Grid item xs={12} sm={6} md={span} {...rest}>
    {children}
  </Grid>
)
```

**2. Edit view → full-screen on mobile.** Inline `Collapse` is cramped on a phone. Below `md`,
present the edit view as a full-screen surface instead of expanding in place. Keep the
desktop `Collapse` untouched:

```jsx
const isMobile = useMediaQuery(theme.breakpoints.down('md'))
// desktop: existing <Collapse> ; mobile: <Dialog fullScreen> or <Drawer anchor="bottom">
```

Use MUI `Dialog` with `fullScreen={isMobile}` (or a bottom `Drawer`) wrapping the same
`children`. Reuse the existing `cancel`/`apply` handlers — **do not fork the state logic**.

**3. Sticky Apply/Cancel.** In the mobile surface, pin `Cancel`/`Apply` to a sticky footer so
they're always reachable above a long, scrolling field list. Make `Apply` full-width and
primary on mobile.

**4. Read-view chips that don't overflow.** The chips row must wrap (or scroll) on narrow
screens. Change the container so chips wrap instead of overflowing, and keep the
toggle/"Edit filters" trigger reachable:

```jsx
// chips wrapper
sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minWidth: 0 }}
```

On mobile, consider collapsing many active chips into a single "Filters (N)" button that
opens the edit surface, with a one-tap "Clear all".

### Modern pattern: group filters (tabs / accordion) on mobile

A flat list of 15+ inputs is a poor phone experience. For filter sets with many fields,
**group related filters** and present the groups as **tabs or accordions inside the mobile
edit surface** (desktop keeps the flat grid). Natural groupings in this app, e.g. on the
Result filter: **Location** (state, LGA, site autocompletes), **Test** (assay, result group,
device type), **Status** (treatment status, display result, the checkboxes), **Date**
(period). Guidelines:

- **Mobile only.** Desktop renders the existing flat `Grid`; grouping is an additive mobile
  branch, not a rewrite.
- **Tabs** when groups are few (3–5) and roughly equal — fast switching, low scroll.
  **Accordion** (`Accordion`/`AccordionSummary`) when groups are many or uneven, or when
  users typically touch one section — show how many filters are active per section in the
  summary (e.g. "Location · 2").
- Group definitions should be **declared once** (an array of `{ label, fields }`) and reused
  by both the desktop order and the mobile groups so they can't drift.
- This grouping is **per-filter-set work** — get design sign-off on the groupings before
  building, since they're domain decisions, not pure layout.

### Don't break these

- **Permissions stay identical.** The `allowed([...])` / `isPermittedUser` gates around
  filter fields (see `FilterContainer.Result.jsx`) must wrap the mobile variants unchanged.
- **Don't fork filter state.** Mobile reuses `useFilterSync`, `addFilter`, `removeFilter`,
  `usePathFilter` — only the *presentation* differs by breakpoint.
- **Custom selects** (`StateSelect`, `AssayMultiSelect`, `PeriodSelector`,
  `SiteAutoCompleteField`, etc.) already render via MUI `TextField`/`Autocomplete`; they
  size to their grid cell, so the grid fix handles them. Only intervene if one has a
  hard-coded pixel width.
- **`PeriodSelector`** (min/max date) is wide — give it `xs={12}` so the range never gets
  squeezed on mobile.

### Testing filters

- Mock `useMediaQuery` (see the snippet at the bottom of this skill) to assert: desktop
  renders the inline `Collapse`; mobile renders the full-screen `Dialog`/`Drawer`.
- Assert `Apply` calls `addFilter` with the same payload in both variants (no logic fork).
- Assert permission-gated fields stay gated in the mobile variant.

## General responsive patterns (later epic tasks)

- **Tables**: do not rework `AspectTable` internals; prefer horizontal scroll
  (`overflow-x: auto` wrapper) as the first mobile pass; card layouts only with design
  approval.
- **Forms** (Formik + Yup): stack fields to a single column below `md` using MUI
  `Grid` responsive props (`xs={12} md={6}`), no logic changes.
- **Dialogs**: use `fullScreen={isMobile}` on `Dialog` for complex dialogs.
- **Charts/dashboards**: needs explicit design input — flag for discussion before
  implementing.

## Project conventions still apply

- All user-facing strings via `defineMessages` + `useIntl`.
- CSS Modules for styles; theme variables via `@import '../../theme/variables.css'`.
- Imports: React → external libs → lodash per-method → internal alphabetized.
- PropTypes on new components.
- Tests: Jest/RTL — mock `useMediaQuery` to test both variants:

```js
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(() => true), // true = mobile
}))
```

- Run `yarn test:single <path>` and `yarn lint` from `web/` before handoff.

## Known constraints

- `web/src/index.html` already has a `viewport` meta tag (with `user-scalable=no` —
  do not change without discussion; relaxing it is an accessibility improvement that
  needs sign-off).
- There is no existing global mobile breakpoint system in the codebase — only ad hoc
  `@media` queries in scattered `.module.css` files. This skill's `md` boundary is the
  standard going forward.

## When in doubt

If a change cannot be made mobile-friendly without altering desktop appearance or the
design guidelines, **stop and raise it for discussion** rather than improvising.
