Bring the writing surface, preview, and error states up to the same design quality as the landing page. The landing page is locked — don't touch it. DO NOT change typing mechanics or signal processing.

Writing surface fixes:

Placeholder text too faint. "type naturally" and "your rhythm shapes the typography" are nearly invisible. Change to: Inter weight 350, color: #A09486, font-size: 1.05rem. Subtle but readable. This is the user's first moment in the writing experience — don't make them squint.

Cursor color. The warm accent cursor #B87A5E is correct but make sure it's visible in both light and dark mode. In dark mode (#1C1915 background), bump cursor opacity to 1.0 and use #C4896A (slightly lighter/brighter warm tone).

"Finish Letter →" link. Top-right corner. Set it in Playfair Display italic, font-size: 0.85rem, color: #2C2824. Persistent underline: border-bottom: 1px solid #C4B5A6, darkens to #2C2824 on hover. Same treatment as landing page CTA but smaller scale. Only appears after user has typed at least one character.

"back" link. Bottom-left is fine but move it to top-left. font-size: 0.75rem, Inter weight 400, color: #8B7E74. Lowercase. No underline at rest, underline on hover.

Dark mode toggle. Top-right, to the left of "Finish Letter →" (or alone if no content yet). Text reads "dark" or "light" in Inter, font-size: 0.7rem, color: #8B7E74, letter-spacing: 0.1em. Separated from "Finish Letter →" by a  ·  middle dot.

The ⌘+Enter / Ctrl+Enter hint at the bottom. Bump to font-size: 0.75rem, Inter weight 400, color: #A09486. Currently too invisible.
Preview/Letter screen redesign:

Layout: match the landing page grid. Left-aligned, padding-left: max(2rem, 8vw). No centered layout, no card wrapper around the letter.

Top of page: "Your Letter" in Playfair Display italic, font-size: 1.8rem, color: #2C2824, margin-bottom: 2rem. This is the equivalent of the landing page headline — it anchors the page.

The letter itself: rendered directly on the background, no card, no border, no shadow. The burst-styled typography IS the visual content. max-width: 36rem. Let it breathe with line-height: 1.9.

Below the letter: a 2rem horizontal rule (same as landing page), then the action links on one line: Keep Writing · Watch Replay · Share · Write Another. All in Inter, font-size: 0.75rem, color: #8B7E74, letter-spacing: 0.08em, separated by  · . "Share" changes to "Copied!" for 2 seconds when clicked. "Write Another" navigates to /write with fresh state.

Below the actions: "a letter only you could have written" in Playfair Display italic, font-size: 0.85rem, color: #8B7E74, margin-top: 3rem. Echoes the landing page footer — typographic bookend.

Inherit the user's theme. If user was writing in dark mode, preview shows dark. If light, preview shows light. Pass the theme via route state.

Error/empty states:

"No letter to preview" page: Use the landing page grid (left-aligned, same padding). "No letter to preview." in Playfair Display italic, font-size: 1.5rem, color: #8B7E74. Below it: Write a Letter → in Playfair Display italic, font-size: 1rem, color: #2C2824, persistent underline (same as landing CTA). This page should feel like part of the same design system, not a fallback.
Replay screen — minor tweaks only:

"Begin Replay" button: replace with a text link in Playfair Display italic, font-size: 1rem, color: #E5DCD2 (light on dark background), persistent underline in #5C5347, darkens to #E5DCD2 on hover. Remove the pill/rounded-full button style.

Controls at bottom after replay starts: text links separated by  · . "pause" / "2×" / "restart" in Inter, font-size: 0.75rem, color: #6B5E54, letter-spacing: 0.1em. Replace icon buttons with these text links.

"Write Your Own →" link after replay completes. Playfair Display italic, font-size: 0.85rem, color: #B8A99A. Below the completion message.

Completion message: change to Playfair Display italic: "a letter, as it was felt" in font-size: 0.85rem, color: #8B7E74.

Design system summary (for consistency):
Headlines/titles: Playfair Display italic
Body/UI: Inter variable
Primary text links: Playfair italic with persistent underline
Secondary text links: Inter, no underline at rest, underline on hover
Separators:  ·  middle dot, color: #C4B5A6
Horizontal rules: width: 2rem, height: 1.5px, background: #2C2824
Dark mode text: #E5DCD2, dark mode links: #B8A99A