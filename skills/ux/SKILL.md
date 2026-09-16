# UX Skill — 10K Hybrid Performance

## Goal
Design every interaction for an athlete who may be tired, sweaty, moving, or using a treadmill. The interface must reduce decisions during the session.

## Rules
1. Training execution is the primary task. The current session and next action must always be obvious.
2. Never auto-start a workout timer. Starting is an explicit user action.
3. Automatic interval transitions are allowed only after the user starts the timer, and must remain optional.
4. No destructive automatic weekly reset. Detect a new week, explain what will happen, and require confirmation.
5. Historical workout data must remain available after rollover.
6. Use touch targets of at least ~44px and avoid tiny inline controls during exercise.
7. On treadmill sessions, display km/h next to or instead of pace; never force mental conversion while running.
8. Prefer progressive disclosure: summary first, exercise/set details on demand.
9. Preserve context. Switching days, opening settings, or pausing the timer must not lose entered data.
10. Feedback must be immediate: completed sets, finished days, timer phase, archived weeks.
11. Avoid shame, streak pressure, or punitive copy. Recovery and deload are valid training outcomes.
12. Make fatigue safer: if recovery inputs are poor, recommend reducing volume/intensity rather than adding work.
13. One-handed use matters. Primary actions should be easy to reach on mobile.
14. Accessibility: visible focus states, sufficient contrast, text labels in addition to color, reduced-motion support.

## Treadmill timer pattern
- User selects Tapis.
- App shows target km/h and target rep duration.
- User gets on the treadmill and sets speed.
- User presses Démarrer.
- App counts down the effort.
- Vibration signals the phase change when supported.
- Recovery starts automatically only when auto-advance is enabled.
- Suivant remains available as an override.

## Weekly rollover pattern
- Detect ISO week change.
- Show a modal explaining that the previous week will be archived, not deleted.
- Offer Continue old week or Archive & start.
- New week gets its own data namespace.
- Block changes require separate explicit confirmation.
