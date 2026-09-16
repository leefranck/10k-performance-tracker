# Design Skill — 10K Hybrid Performance

## Visual direction
Calm, performance-oriented, mobile-first. The product should feel like a training instrument rather than a gamified fitness toy.

## Design system
- Background: very light neutral blue/gray.
- Surfaces: white cards with subtle borders.
- Primary action: indigo.
- Success: green, used for completion only.
- Warning: amber, used for recovery/fatigue guidance.
- Timer: high-contrast dark surface with large tabular numerals.
- Border radius: 12–22px depending on hierarchy.
- Minimum interactive height: ~44–48px.

## Hierarchy
1. Goal and current block.
2. Day selection.
3. Today's session.
4. Timer when active.
5. Recovery and secondary information.

## Typography
- Strong compact headings with slightly negative tracking.
- Small uppercase eyebrow labels for context.
- Tabular numerals for timers and performance numbers.
- Avoid long paragraphs inside workout execution screens.

## Components
- Goal card
- Weekly metric cards
- Program/block card
- 7-day navigator
- Session card
- Outside/Treadmill segmented control
- Run specification cards
- Expandable exercise cards
- Set row with kg / reps / completion
- Sticky guided timer
- Recovery check
- History modal

## States
Every interactive component needs default, active, completed, disabled, focus-visible, and fatigue-warning states where relevant.
