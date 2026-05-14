---
name: ux-review
description: Comprehensive UX/UI review covering usability, accessibility, visual hierarchy, information architecture, interaction design, microcopy, states (loading/error/empty/success), responsive behavior, forms, and trust signals. Use this skill whenever the user asks for a UX review, UI review, design review, user experience evaluation, usability assessment, accessibility audit, or any feedback on a user-facing interface — including informal requests like "what do you think of this design?", "how can I improve this UI?", "is this usable?", "make this better", or any evaluation of frontend code, components, pages, flows, mockups, or screenshots from a user's perspective. Use even when the user doesn't say the word "UX" — if the subject is something a human will see and interact with, this skill applies.
---

# UX Review

A systematic, thorough review of a user-facing interface. The goal is to surface friction, confusion, accessibility barriers, and missed opportunities — and to do it specifically enough that the author can act on every finding.

## Workflow

Follow these steps in order. Generic UX feedback is useless; the value of this review comes from being grounded in the actual product and its actual users.

### 1. Establish scope and form

Figure out what is being reviewed:
- **Code** — React/Vue/Svelte components, HTML/CSS, a Tailwind project. Read the actual code.
- **A live URL** — if the user gives one, ask them to also describe the key flows (you can't actually click around the way a user would).
- **Screenshots or mockups** — image files. View them.
- **A specific flow vs the whole product** — narrower scope = deeper review.

If unclear, ask. "Review my app" is too broad; "review the signup flow in `src/auth/`" is reviewable.

### 2. Establish product context

Spend a few minutes on this before evaluating anything. Without context, every UX review devolves into generic checklist-thumping.

- What is the product? What does it do?
- Who is the target user? A consumer? A power user? A developer? An admin? An elderly relative?
- What is the primary job-to-be-done in the scope under review?
- What stage is this — early prototype, beta, mature product? (Standards differ.)
- What platform — web, mobile web, native iOS/Android, desktop, embedded? Touch or pointer? Keyboard primary?
- Is there a design system in use? Look for tokens, component libraries, style guides — match the project's conventions, don't impose your own.

If the user hasn't told you and you can't infer, ask before launching into critique. A B2B admin dashboard for power users and a consumer onboarding flow get reviewed very differently.

### 3. Walk the user journey

Before evaluating individual elements, mentally walk through the key flow as a target user would. Where are they coming from? What are they trying to accomplish? What is the next thing they need to do at each step? This anchors the review in real use, not abstract heuristics.

For each step in the flow, ask: *can a first-time user figure out what to do next without thinking hard?*

### 4. Evaluate systematically against each dimension

Walk through every dimension in the next section. Note findings as you go. Don't stop at the first few — thoroughness is the point.

### 5. Categorize findings by severity and produce the report

See "Severity" and "Output format" below.

## Review dimensions

### Heuristic evaluation

Walk through these (Nielsen's heuristics, adapted). For each, ask: where does this interface succeed, where does it fail?

- **Visibility of system status** — the user always knows what's happening. Loading states, progress indicators, confirmation of submitted actions, current location in the app.
- **Match between system and real world** — language and concepts the user already knows. No jargon from the codebase leaking into UI strings.
- **User control and freedom** — clearly marked exits, undo/redo, ability to cancel long operations, no dead-end states.
- **Consistency and standards** — same word means the same thing everywhere; same action looks the same everywhere; follows platform conventions where they exist.
- **Error prevention** — make the wrong action hard. Confirm destructive actions. Validate before submission. Disable buttons that can't yet be used (with a hint about why).
- **Recognition over recall** — show options rather than requiring the user to remember them. Visible labels, autocomplete, recently-used items.
- **Flexibility and efficiency** — shortcuts and accelerators for repeat users (keyboard shortcuts, bulk actions) without cluttering the path for new users.
- **Aesthetic and minimalist design** — every element earns its place. Nothing decorative competing with the actual content.
- **Help users recognize, diagnose, and recover from errors** — error messages in plain language, specific about what's wrong, with a clear path to resolution.
- **Help and documentation** — when needed, easy to find, task-focused, not buried.

### Information architecture

- Hierarchy of information matches user priority — the most important thing is the most prominent thing
- Grouping is meaningful — related things together, unrelated things apart
- Labels are clear, specific, and survive translation
- Navigation structure matches the user's mental model, not the engineering team's
- Findability — common tasks reachable in few clicks, with predictable paths
- No orphan pages, no dead links

### Visual design

- **Hierarchy** — size, weight, color, position guide the eye in priority order. The user knows where to look first.
- **Whitespace** — generous enough that the design breathes; not so much that elements feel disconnected
- **Typography** — readable line length (45–75 characters for body), sufficient line height (1.4–1.6 for body), clear scale, no more than 2–3 typefaces
- **Color** — purposeful, not arbitrary; semantic colors (success/warning/error) consistent; no reliance on color alone to convey meaning
- **Alignment and grid** — elements line up; visual grid is consistent
- **Iconography** — icons are recognizable, accompanied by labels for non-universal ones, consistent in style and weight
- **Contrast ratios** — body text ≥ 4.5:1, large text ≥ 3:1 against background (WCAG AA)

### Interaction design

- **Affordances** — clickable things look clickable; non-clickable things don't
- **Feedback** — every user action produces visible response within ~100ms (hover, click, submit confirmations)
- **States** — hover, focus, active, disabled, loading, error all designed; focus states clearly visible (don't `outline: none` without replacement)
- **Touch targets** — ≥ 44×44 px on touch devices; sufficient spacing to prevent mis-taps
- **Animation** — purposeful (showing relationships, smoothing transitions), not decorative; respects `prefers-reduced-motion`; not so slow it impedes power users
- **Gestures** — discoverable, not the only way to do something important
- **Drag and drop, complex interactions** — keyboard alternative exists

### Accessibility (WCAG 2.1 AA baseline)

Treat accessibility findings as functional bugs, not nice-to-haves.

- **Color contrast** — verified against WCAG AA minimums; check both light and dark mode if applicable
- **Keyboard navigation** — every interactive element reachable by Tab; logical tab order; visible focus indicator; no keyboard traps; Escape closes modals
- **Screen readers** — semantic HTML (`<button>`, `<nav>`, `<main>`, headings in order); ARIA only where semantic HTML can't do the job; accessible names for icon-only buttons; landmark regions
- **Form labels** — every input has a programmatic label (not just placeholder text); required fields marked accessibly; errors associated with fields
- **Images** — alt text on informative images; `alt=""` on decorative ones; complex images have long descriptions
- **Motion** — `prefers-reduced-motion` respected; no autoplay video with sound; no flashing > 3Hz
- **Zoom and reflow** — works at 200% zoom; reflows at 320 px width without horizontal scroll
- **Text alternatives** — captions for video, transcripts for audio
- **Language** — `lang` attribute set; language changes within page marked
- **Skip links** — for keyboard users on pages with significant navigation

### States to verify

This is where most interfaces fail. Walk through every state explicitly:

- **Initial / empty** — first-time user sees something helpful, not a blank page; clear next action
- **Loading** — skeleton screens or spinners; estimated time for long operations; nothing jumps when content loads
- **Partial data** — what if some data loads and some doesn't? Some images missing? Some fields null?
- **Error** — useful error message; clear recovery path; preserves user input where possible
- **Success** — confirmation visible; clear what happens next
- **Disabled** — visually distinct; reason for disabling communicated
- **Hover / focus / active** — all designed, all distinguishable
- **Offline** — gracefully handled or clearly communicated
- **First-time vs returning** — appropriate onboarding for the former; no nagging for the latter
- **Long content** — what happens with 10× the expected number of items? With very long names?
- **Boundary content** — single item, zero items, max items

### Microcopy & content

- **Clarity** — plain language, no jargon, no internal team vocabulary
- **Conciseness** — short enough to scan, long enough to be unambiguous
- **Voice and tone** — consistent across the interface; appropriate for the audience and the moment (calm during errors, celebratory at success, neutral by default)
- **Buttons** — action-oriented verbs that describe what happens ("Save changes", not "OK"); "Cancel" rather than negations
- **Error messages** — specific about what went wrong, in second person, with a path forward; never blame the user, never expose stack traces
- **Empty state copy** — explains what would be here and how to get something here
- **Helper text** — present where users get stuck; absent where they don't
- **Internationalization** — strings externalized; layouts accommodate longer translations (German ~30% longer than English); no assumed name/address/date formats

### Forms

Forms are where users abandon. Special attention:

- Visible, persistent labels (not just placeholders that disappear)
- Required vs optional clearly marked (mark the rarer one)
- Field grouping matches user mental model, not database schema
- Appropriate input types (`email`, `tel`, `number`, `date`) for mobile keyboards
- `autocomplete` attributes set correctly so password managers and autofill work
- Inline validation: validate on blur, not every keystroke; show success states, not just errors
- Errors appear near the field, explain the problem, suggest a fix; on submit, scroll to and focus the first error
- Preserve input on error — never make the user retype
- Smart defaults that match the common case
- Progress indicator for multi-step flows; ability to go back without results without losing data
- Submit button reflects state — disabled until valid, loading state during submission, never double-submittable

### Responsive & cross-device

- Works at mobile widths (test 375 px) without horizontal scroll
- Touch targets sized for fingers, not cursors
- Hover-dependent interactions have a tap equivalent
- Text scales appropriately; no fixed pixel font sizes for body text
- Images use `srcset` or modern formats; don't ship 4K images to phones
- Tables and complex layouts have a strategy for narrow viewports
- Modals and overlays don't trap the user on mobile

### Performance (as the user feels it)

- Time to first meaningful paint feels fast (or has a skeleton)
- Interactions feel responsive — no perceptible lag on click
- Optimistic UI where the operation is reliable
- No layout shift as content loads
- Image lazy-loading where appropriate, but above-the-fold loaded eagerly
- Bundle size sane for the audience (a marketing site for general users vs a complex SaaS for daily users)

### Trust & credibility

- Clear value proposition above the fold for marketing surfaces
- Transparent about data collection, account requirements, pricing
- Easy to find contact / support / docs
- Professional polish — no typos, no broken images, no Lorem Ipsum, no misaligned elements
- Security signals where appropriate (HTTPS, trust badges where genuine, not decorative)
- Honest UX — no dark patterns, no fake urgency, no preselected upsells, no hidden costs at checkout, easy to cancel anything

## Severity

Tag every finding. Calibrate honestly — inflating severity erodes trust; under-rating real issues lets them ship.

- **Critical** — blocks task completion, fails an accessibility requirement (WCAG A/AA), causes data loss, dark pattern. Must fix.
- **High** — significant friction, real confusion likely, important state unhandled, mobile fundamentally broken. Should fix before shipping.
- **Medium** — improvement opportunity, polish gap, missed convention, suboptimal copy. Worth addressing.
- **Low** — refinement, taste call, nice-to-have. Author's discretion.
- **Question** — something you don't understand about the design choice and want explained. Use sparingly.

## Output format

Produce a markdown report with this structure:

```markdown
# UX Review: <scope>

## Summary
2–4 sentences. Overall assessment, what the user is most likely to struggle with, and a clear signal of whether this is close to ready or needs significant work.

## Critical
- **<location: file:line, screen name, or flow step>** — <one-line title>
  <what the problem is, why it matters from the user's perspective, suggested fix>

## High
<same format>

## Medium
<same format>

## Low
<same format>

## Questions
- <questions for the designer/author>

## What's working well
- <2–5 genuine positives — not filler. Skip the section if there's nothing real to say.>
```

For each finding:
- **Location** — specific. `src/Signup.tsx:84`, "the onboarding empty state", "step 3 of the checkout flow". Vague locations make findings unactionable.
- **The user-centered problem** — what does a real user experience, not "this violates heuristic 4"
- **Why it matters** — what's the consequence? Confusion? Abandonment? Accessibility barrier?
- **Suggested fix or direction** — concrete enough to act on; doesn't have to be the final answer, but should point somewhere

If the scope is large, group findings by screen, flow, or component within each severity section.

## Reminders

**Ground every finding in the user, not the framework.** Not "this should be a `<button>` not a `<div>`" — "this isn't reachable by keyboard, so users navigating with Tab can't activate it. Use a `<button>` element."

**Be specific.** "Improve the form" is not a finding. "The email field on `Signup.tsx:42` has no `autocomplete='email'`, so password managers won't autofill it — 30 seconds of friction per signup" is a finding.

**Respect deliberate trade-offs.** A design system with intentional density, a power-user interface that assumes training, a deliberately bare empty state — these may all be correct. Flag the consideration, ask if it's intentional, don't moralize.

**Don't impose your aesthetic.** "I would have chosen a different color" is not a finding. "Body text on the hero is #999 on #FFF, which is 2.85:1 — below WCAG AA's 4.5:1 minimum" is a finding.

**Test the obvious.** Many critical issues — missing focus states, broken keyboard nav, error states that crash the page — hide in the most basic interactions. Check those first.

**Call out what works.** A clear empty state, a well-written error message, a clever piece of progressive disclosure — naming these makes the critical findings easier to receive and tells the author what to keep.
