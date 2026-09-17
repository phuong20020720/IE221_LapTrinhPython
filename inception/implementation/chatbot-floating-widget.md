# Chatbot floating widget

## Sources

- Requirement: User request for a draggable AI chatbot launcher fixed at the right corner
- Architecture: `inception/architecture/adr/003-chatbot-boundary.md`
- ADR: ADR-003

## Acceptance criteria

- [x] Chatbot is represented by an AI launcher in the bottom-right corner by default.
- [x] The launcher stays fixed while the page scrolls.
- [x] The launcher can be dragged within the viewport.
- [x] Clicking the launcher opens the chat panel; dragging it does not open the panel accidentally.
- [x] The panel can be closed and retains the existing chatbot messaging behavior.
- [x] The chat panel keeps a fixed size while only its message area scrolls.
- [x] The launcher uses a tightly cropped version of the supplied chatbot logo asset.
- [x] The enlarged panel keeps the first message at the top and automatically scrolls as messages are added.
- [x] The launcher logo remains visible while the panel is open, and clicking the colored panel header closes it.
- [x] The closed launcher includes a visible prompt so users know it opens chat.
- [x] The chatbot is available across all customer routes and excluded from login/admin routes.

## Implementation map

| Layer | Files | Responsibility |
|---|---|---|
| Database | N/A | No persistence is required for launcher position in this increment. |
| Backend | N/A | Existing chatbot API remains unchanged. |
| Frontend | `frontend/src/app/CustomerLayout.tsx`, `frontend/src/app/App.tsx`, `frontend/src/features/chatbot/ChatbotWidget.tsx`, `frontend/src/styles/index.css`, `frontend/src/assets/images/chatbot-logo-cropped.png` | Customer-wide layout plus the fixed draggable chatbot widget. |
| Tests | `frontend/src/app/App.test.tsx`, `frontend/src/features/chatbot/ChatbotWidget.test.tsx` | Customer-route visibility, internal-route exclusion, open/close, and drag coverage. |

## Evidence

| Command/check | Result |
|---|---|
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm test` | passed |
| `npm run build` | passed |

## Open items

- Không
