# ChewIQ Design System — "Botanical Clinical"

**Date:** 2026-03-18
**Status:** Approved

## Overview

Complete design system for ChewIQ, a chronic illness protocol management app. Target audience: people with chronic illness (brain fog, fatigue) and functional medicine practitioners. The system must be warm, trustworthy, readable, and polished.

**Zero inline styles. Everything through the design system.**

## Design Decisions (Locked)

### Aesthetic: Botanical Clinical
Precision meets warmth. Like a high-end functional medicine clinic.

### Color: Teal + Warm Neutrals
- **Brand:** Teal (OKLCH hue 195°) — the ONLY chromatic brand color
- **Neutrals:** Warm-tinted (hue 80°) — cream surfaces, warm grays for text/borders
- **Semantic:** Green (allowed/safe), Red (symptoms/avoid/danger), Amber (warnings/moderation), Purple (supplements/info) — driven by data, not brand
- **No accent color.** The warmth comes from the neutral environment, not a competing hue.
- **Logo:** "Chew" in teal-800, "IQ" in teal-500 italic. Both Fraunces.

### Typography
- **Display:** Fraunces (variable serif) — headings, logo, page titles
- **Body:** Source Sans 3 (humanist sans) — everything else
- **Loaded via:** next/font/google with CSS variables

### Component Style: Hybrid Soft Layers
- Ghost border (1px, semi-transparent warm) + warm-tinted shadow
- Cards feel like paper stacked on a desk
- Inputs use solid warm borders
- Primary buttons have slight depth shadow
- Badges use tinted background + inset ring

### Motion
- Page entrance: fade-in-up (0.4s expo ease-out)
- Staggered children: 50ms delay increments
- Buttons: active:scale-[0.98]
- Transitions: 200ms with cubic-bezier(0.16, 1, 0.3, 1)

## Token System (globals.css)

```
Teal scale:    50-900 (hue 195, brand)
Warm scale:    50-900 (hue 80, neutrals)
Surfaces:      surface (warm cream), card (warm white), overlay
Text:          primary (warm-900), secondary (warm-500), muted (warm-400)
Borders:       warm-tinted oklch
Shadows:       card, elevated, float (all warm-tinted)
Radii:         sm(0.5rem), md(0.75rem), lg(1rem), xl(1.25rem), 2xl(1.5rem)
Fonts:         --font-display (Fraunces), --font-body (Source Sans 3)
Easing:        --ease-out-expo
```

## Components to Build (9 new)

1. **Dialog** — focus trap, escape-to-close, scroll lock, backdrop blur
2. **Select** — styled dropdown matching Input, chevron icon, 44px height
3. **Textarea** — multi-line Input with label/error, optional auto-resize
4. **Tabs** — horizontal toggle, pill active indicator (teal)
5. **Toast** — slide-in notification, success/error/info variants, auto-dismiss
6. **EmptyState** — icon + title + description + optional CTA
7. **Avatar** — initials fallback, sizes sm/md/lg, teal tint for user
8. **Progress** — animated bar, teal fill on warm track, label support
9. **Skeleton** — pulse animation on warm background, text/card/circle variants

## Components to Update (5 existing)

- Button, Card, Badge, Input, Spinner — update to teal + warm neutrals, Source Sans 3

## Barrel Export

components/ui/index.ts re-exports all components.

## Page Cleanup

All pages must use design tokens only. Replace every hardcoded slate-*, indigo-*, blue-* with design system tokens. No exceptions.

## Out of Scope
- Dark mode (future)
- Landing/marketing page redesign (separate)
- Admin UI polish (separate)
