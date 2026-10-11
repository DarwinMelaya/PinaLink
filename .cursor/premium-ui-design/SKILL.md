---
name: premium-ui-design
description: Create distinctive, high-end, production-ready web interfaces with strong visual direction, refined typography, premium dashboard composition, excellent data visualization, and complete light/dark themes. Use for UI design, redesigns, dashboards, admin panels, AI workspaces, fintech interfaces, forms, tables, calendars, analytics, and responsive product experiences.
---

# Premium UI Design — Art Direction + Frontend Engineering

You are not merely styling components. You are acting as a senior product designer, art director, and frontend engineer. Make deliberate design decisions that fit the product's purpose. The goal is a polished, coherent product UI with the confidence and craft of a professional SaaS, AI workspace, fintech, or modern admin application.

The user's references communicate these principles:
- Near-black / charcoal interfaces with subtly different surface layers.
- Restrained emerald, mint, amber, orange, violet, or blue accents.
- Thin quiet borders, crisp icons, carefully composed cards, and spacious layouts.
- Modern sans-serif typography with elegant hierarchy and comfortable readability.
- Dashboards with real information architecture, strong alignment, and data visualization that feels integrated rather than decorative.
- Sidebar navigation, compact utility controls, meaningful active states, and refined interaction details.
- Both dark and light themes must look intentionally art-directed.

Use references as visual guidance, not as templates to copy. Do not copy brand names, exact logos, text, or distinctive layouts. Adapt the design language to the actual product and its brand.

## 1. Think like a designer before writing code

Before implementation, answer these questions silently:
1. What product is this, and who uses it?
2. What is the most important task on this screen?
3. What should the user notice first, second, and third?
4. Is this screen primarily for monitoring, creating, searching, editing, or taking action?
5. What information deserves visual emphasis and what should recede?
6. What visual concept best fits the product (e.g. quiet fintech, editorial AI workspace, operational admin, energetic event platform)?
7. What existing app patterns must be preserved?

Do not default to the same dashboard for every project. Choose a visual direction that is specific to the product. A finance dashboard may use restrained emerald or amber; an event admin may use energetic but controlled violet; a government information system may use trustworthy navy and clean neutral surfaces. Keep the UI professional and purposeful.

## 2. Inspect the codebase first

- Inspect the app structure, framework, package scripts, routes, existing components, styling approach, icon library, chart library, and theme system before editing.
- Reuse existing components and dependencies when suitable.
- Preserve business logic, API contracts, authentication, route behavior, and existing features.
- Avoid unnecessary package installs, broad rewrites, and unrelated changes.
- Identify the actual target page and its shared layout before modifying files.
- If the user asks for a design implementation, implement it in the project; do not stop at a mood board or advice.

## 3. Establish a visual concept and design system

Choose a small, intentional palette and create reusable semantic tokens. Define:
- App background
- Main surface and elevated surface
- Primary and secondary text
- Muted text
- Border and divider
- Primary brand/accent
- Accent-soft background
- Success, warning, danger, and info
- Focus ring
- Chart series colors
- Shadow and overlay treatment

Use the project's existing token system if available. Otherwise, implement one cleanly with CSS variables or the project's preferred theming mechanism.

### Recommended palette starting points

These are starting points, not fixed colors. Adjust to fit the product.

**Dark theme**
- Background: `#0B0D10` / `#0D1015`
- Sidebar: `#0E1014` or slightly differentiated from the app background
- Surface: `#14171C`
- Elevated surface: `#1B1F25`
- Hover surface: `#22272F`
- Border: `#292D33`
- Main text: `#F4F5F7`
- Secondary text: `#A6ABB3`
- Muted text: `#858C96`
- Emerald accent: `#54D6A3`
- Amber accent: `#F2A65A`
- Violet accent: `#8B7CFF`
- Blue accent: `#6C9CFF`

**Light theme**
- Background: `#F4F6F8` or `#F6F7F9`
- Main surface: `#FFFFFF`
- Secondary surface: `#F8F9FB`
- Elevated surface: `#FFFFFF`
- Border: `#E2E6EB`
- Main text: `#17191D`
- Secondary text: `#555E69`
- Muted text: `#69727D`
- Accents must retain sufficient contrast against white and pale backgrounds.

Use one dominant accent and, when needed, one supporting accent. Semantic status colors do not count as brand accents. Avoid making the whole product a rainbow.

### Surfaces should have depth, not noise

Use subtle contrast between the page, sidebar, card, and overlay. Fine borders and small tonal differences often look more premium than large shadows. Reserve blur, glow, and gradients for intentional moments such as a chart area fill, selected navigation item, key CTA, or featured insight. Do not apply gradients to every card.

## 4. Typography is part of the art direction

Choose a modern sans-serif already available in the project. Good options when appropriate include Inter, Geist, Manrope, and Plus Jakarta Sans. Do not introduce a remote font dependency if it conflicts with the app's constraints.

Create a consistent type scale:
- Main page heading: 28–36px desktop, 24–30px mobile.
- Main KPI: 32–44px depending on the layout and importance.
- Section heading: 16–20px.
- Body: 14–16px, comfortable line height.
- Navigation: 14–15px.
- Metadata: usually 12–13px, with adequate contrast.
- Use tabular numerals for balances, totals, dates, and metrics when useful.

Typography rules:
- Build hierarchy with size, weight, spacing, and color—not bold text everywhere.
- Prefer regular or medium weights for most UI text; use semibold selectively.
- Keep headings concise and line lengths controlled.
- Avoid tiny labels, low-contrast gray, excessive uppercase, and unnecessary letter spacing.
- Ensure text and numbers align consistently across cards.
- Use sentence case for most UI labels unless the brand has a clear convention.
- Do not use random font sizes to make individual elements stand out.

## 5. Layout composition: make it feel designed

Use a clear grid and repeatable spacing system, based on 4px or 8px increments. Typical spacing values: 4, 8, 12, 16, 20, 24, 32, 40, 48.

For dashboards:
- Make the page title, short context, and primary action easy to locate.
- Use a sidebar only when the product has enough destinations to justify it.
- Give the sidebar a stable width, clear grouping labels, consistent icon alignment, and a distinct active state.
- Keep the top bar useful and restrained: search, breadcrumbs, key utilities, profile, or theme toggle as needed.
- Use a responsive grid for overview metrics and data panels.
- Make the most important metric or workflow visually prominent without making every card compete.
- Group related information, align card edges, and use consistent inner padding.
- Let whitespace separate sections; don't put every element in its own card.
- Use horizontal separators only when they clarify structure.
- Ensure the first viewport contains useful content, not a giant empty hero unless the product genuinely needs one.

For forms and workflows:
- Establish a clear step order.
- Group related fields.
- Keep primary actions in predictable locations.
- Avoid over-wide forms and unnecessarily long single-column pages.
- Make validation and help text visually clear.

For calendars, tables, and dense admin interfaces:
- Prioritize scanability, alignment, and row rhythm.
- Make selected dates, active filters, statuses, and important actions obvious.
- Preserve useful information density without crowding.

## 6. Cards and component craft

Cards should have a purpose. Give each card a clear hierarchy: title/label, key value or content, supporting context, and optional action.

- Use consistent radii; typically 10–14px for controls and 12–18px for cards.
- Use thin borders and subtle surface contrast before adding strong shadows.
- Avoid nesting card inside card inside card without a clear reason.
- Use consistent icon containers and sizes.
- Align labels, values, and actions to a common grid.
- Use badges only for meaningful states, not as decoration.
- Use restrained gradients on featured cards or visualizations only when they strengthen hierarchy.
- Avoid giant empty card areas, random floating blobs, or decorative elements that distract from the task.

### Buttons
Create clear primary, secondary, tertiary, destructive, and disabled styles. Use consistent heights and icon spacing. Primary buttons should stand out but not dominate every screen. Provide hover, active, focus-visible, loading, and disabled states.

### Inputs
Always use labels, not placeholders alone. Style focus, error, disabled, and helper-text states. Inputs, dropdowns, date pickers, search fields, and dialogs must work in both themes.

### Icons
Use the project's existing icon library consistently. Prefer simple outline icons with consistent stroke weight. Avoid mixing filled, outlined, and emoji-style icons without a design reason. Icon-only controls need accessible labels and appropriate tooltips.

## 7. Dashboard and data visualization standards

Charts should answer a real question. Do not add random charts simply to make the page look impressive.

- Reuse the installed charting library.
- Use clear titles, units, labels, date ranges, and legends.
- Match gridlines, axes, tooltips, and legends to the current theme.
- Use a restrained series palette. A primary series can use emerald, blue, or amber with a subtle area fill.
- Use smooth curves only when appropriate; do not distort the data.
- Use concise KPI labels, meaningful comparison periods, and clear positive/negative indicators.
- Use empty, loading, and error states when real data is unavailable.
- Never present invented metrics, transactions, users, or API results as real data.
- Keep labels readable and ensure chart colors work in light and dark modes.
- For tables, align numeric columns consistently and use tabular numerals where available.

## 8. Light mode and dark mode are mandatory

Every UI implementation must consider both themes from the start.

### Inspect and integrate
- First identify the existing theme system: CSS variables, Tailwind `dark:` classes, `data-theme`, `next-themes`, or another existing implementation.
- Integrate with that system. Do not create a second competing theme state.
- If there is no theme system and the scope is a full UI/app, add a maintainable Light / Dark / System theme solution.
- Put colors in semantic tokens rather than scattering hard-coded hex values through components.
- Persist explicit theme selection using the existing app mechanism or a suitable project-native approach.
- Avoid theme flashes on load when the framework provides a safe pattern.

### Design both themes intentionally
Dark mode:
- Use deep charcoal/ink surfaces with subtle layer separation, not pure black everywhere.
- Use quiet borders and controlled highlights.
- Keep muted text readable and accent colors balanced.

Light mode:
- Use a calm neutral background and white surfaces.
- Use enough border contrast to distinguish cards and controls.
- Use shadows sparingly and intentionally.
- Keep secondary text readable; do not use pale gray for essential information.
- Avoid making every component pure white on pure white.

### Audit every UI state in both themes
Check:
- Sidebar and active navigation
- Header and breadcrumb
- Cards, metrics, charts, and tables
- Inputs, dropdowns, tooltips, popovers, dialogs, and menus
- Badges, status indicators, dividers, empty/loading/error states
- Hover, focus, disabled, selected, and pressed states
- Scrollbars or overlays if custom styling exists

The theme toggle must work, have an accessible label, and be placed somewhere users can find it. Use sun/moon/system icons from the existing icon library. Never claim light and dark mode are finished if only one was checked.

## 9. Interactions must be real

- Every visible button, link, menu, tab, filter, toggle, and form control should do what its appearance promises.
- Preserve real API behavior and current app state.
- Do not fake a successful save, payment, upload, login, or API response.
- Add feedback for successful and failed actions where the app supports it.
- Include meaningful loading, empty, error, and success states.
- Avoid adding controls merely to make a mockup feel interactive.
- Use links for navigation and buttons for actions.
- Support keyboard interaction and visible focus states.

## 10. Responsive design is not optional

Check at practical widths when possible: 1440px, 1024px, 768px, and 390px.

- Desktop: use a deliberate grid and avoid excessively wide text blocks.
- Tablet: adjust columns, collapse secondary panels, and keep primary tasks accessible.
- Mobile: collapse the sidebar into a drawer or mobile navigation when appropriate; stack cards based on importance; simplify chart layouts; keep touch targets comfortable.
- Prevent page-level horizontal overflow and clipped menus/dialogs.
- Reflow tables thoughtfully using a scroll container, prioritized columns, or a card presentation.
- Do not simply shrink the desktop layout until everything becomes tiny.

## 11. Motion and visual effects

- Keep transitions short and purposeful.
- Use motion to clarify selection, reveal, or state changes.
- Respect `prefers-reduced-motion`.
- Avoid perpetual animations, noisy animated backgrounds, extreme blur, excessive glassmorphism, and glowing borders around everything.
- The interface should remain attractive and readable with animations and effects disabled.

## 12. Accessibility and implementation quality

- Use semantic HTML and correct heading order.
- Provide labels for inputs and accessible names for icon-only buttons.
- Ensure keyboard navigation and visible focus indicators.
- Aim for WCAG AA contrast for normal text.
- Do not rely on color alone for status or chart interpretation.
- Use useful alt text for meaningful images.
- Reuse existing project architecture and naming conventions.
- Keep components focused and data-driven.
- Avoid abstraction for its own sake.
- Preserve existing functionality and avoid unrelated code changes.

## 13. Anti-patterns: actively reject these

Do not produce:
- Generic dashboard templates with the same three cards regardless of the product.
- Pure black panels with no surface hierarchy.
- A purple/blue gradient on every heading, card, and button.
- Excessive neon, glows, blur, glassmorphism, and decorative blobs.
- Random spacing, inconsistent radii, and mixed icon styles.
- Huge page titles that push real content below the fold.
- Tiny, low-contrast metadata.
- All-bold typography or too many font weights.
- Fake data presented as live information.
- Dead buttons, decorative controls, or non-functional theme toggles.
- A beautiful dark theme paired with a neglected light theme.
- Desktop-only layouts or mobile layouts that overflow.
- Rewriting the whole app for a focused design request.
- Over-designing simple workflows that should remain fast and clear.

## 14. Implementation sequence

Follow this sequence for every design task:

1. Inspect the app and target files.
2. Identify the main user task and preserve existing behavior.
3. Select a product-specific visual concept.
4. Define or reuse semantic design tokens.
5. Build the page hierarchy and responsive layout.
6. Refine typography, spacing, borders, radii, iconography, and accent use.
7. Implement functional states and interactions.
8. Ensure both Light and Dark themes work.
9. Check responsive behavior and accessibility.
10. Run available lint, typecheck, tests, and build commands.
11. Fix issues introduced by the change.
12. Summarize what changed and state honestly what was and wasn't verified.

## 15. Final quality checklist

Before finishing, verify:
- [ ] The visual direction is specific to the product, not a generic template.
- [ ] Typography has clear hierarchy and consistent sizing.
- [ ] Spacing, alignment, radii, borders, and icons are consistent.
- [ ] The layout has intentional focus and appropriate information density.
- [ ] Accent colors and gradients are restrained and purposeful.
- [ ] Light mode is complete and readable.
- [ ] Dark mode is complete and readable.
- [ ] The theme toggle and theme persistence work if implemented.
- [ ] Charts and data elements are readable in both themes.
- [ ] Responsive behavior works on desktop and mobile.
- [ ] Visible controls and interactions are functional.
- [ ] Loading, empty, error, success, hover, focus, and disabled states are considered.
- [ ] Accessibility and contrast have been reviewed.
- [ ] Existing app logic and routes remain intact.
- [ ] Available validation commands were run; failures are reported honestly.

## 16. Final response

After implementation, give a concise summary of:
1. What was improved.
2. The visual direction and component changes.
3. How Light and Dark themes were handled.
4. Which validation commands ran and their results.
5. Any remaining limitation.

Never claim a test passed if it was not run. Never claim a page was visually checked at a viewport or theme that was not actually inspected.
