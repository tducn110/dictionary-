# AI Task Board

Track the status of refactoring phases and future enhancements.

## Status Summary
| Phase | Description | Priority | Status | Milestone/Tag |
| :--- | :--- | :--- | :--- | :--- |
| **Phase A** | Refactor Landing Page demo to reuse `useReplayController` | P0 | **COMPLETED** | `refactor-landing-demo-v1` |
| **Phase B** | LocalStorage Session Recovery | P1 | **IN PROGRESS** | - |
| **Phase C** | Keyboard controls + Analytics charts | P2 | **DEFERRED** | - |

---

## Active Tasks (Phase B)
- [ ] Implement `localStorage` session recovery in the writing flow.
- [ ] Version storage keys for session data.
- [ ] Debounce auto-saves to prevent storage thrashing.
- [ ] Restore draft on reload.
- [ ] Clear draft after submit or reset.
- [ ] Write tests verifying basic save, restore, and clear.
