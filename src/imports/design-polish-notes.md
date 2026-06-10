Polish pass. The layout and typography direction are correct. Now make it feel finished — like a designer spent hours on the details. DO NOT change the layout direction (left-aligned, serif headline, flat background). DO NOT change any JavaScript.

Alignment grid:
Everything on the landing page should align to the same left margin: padding-left: max(2rem, 8vw). The headline, subtitle, demo card, button, footer text — all share this left edge. Right now the card is floating independently. A shared left edge is the single biggest signal of intentional design.
Demo card: set max-width: 36rem and remove any extra left padding on the card itself — the card's content should optically align with the subtitle text above it.

Headline refinement:
Reduce size to clamp(2.2rem, 5.5vw, 4rem) — still large, but not overwhelming.
Weight 400 italic (keep). Color #2C2824 (keep).
Add margin-bottom: 1.5rem between headline and subtitle.
The headline should have no more than 14 words across 2 lines. Current text is good.

Subtitle refinement:
"a letter that proves you were here." on line 1
"not generated. not autocompleted. yours." on line 2
Use explicit <br> for this line break — don't let it reflow randomly.
Style: font-size: 0.9rem, line-height: 1.8, color: #8B7E74, Inter weight 350.
margin-bottom: 3rem before the demo card.

Demo card:
Background: #FFFDF8
No border. No border-radius (use rounded-none).
Shadow: 0 1px 3px rgba(0,0,0,0.03) — barely there.
Padding: 2rem 2.5rem
The text inside should use the same font size as the writing surface: clamp(1rem, 2vw, 1.25rem)

Button:
Remove the dark filled background entirely.
Make it a text link: "Write Your Letter →" in #2C2824, font-size: 0.85rem, letter-spacing: 0.08em, Inter weight 450.
Underline on hover (use border-bottom: 1px solid #2C2824 with padding-bottom, not text-decoration).
No background, no border, no padding, no rounded corners. Just text with an arrow.
margin-top: 2rem below the demo card.

Header "FONT OF INTENT":
font-size: 0.65rem, letter-spacing: 0.3em, color: #A0958A, Inter weight 400.
This should whisper, not speak.

Footer "the letter only a human could write":
Same left margin as everything else.
font-size: 0.65rem, letter-spacing: 0.2em, color: #B8ADA2, Inter weight 350.
margin-bottom: 2rem from bottom edge.

Spacing rhythm:
Use a consistent vertical rhythm. From top: header (py 3rem) → headline → 1.5rem → subtitle → 3rem → demo card → 2rem → CTA link → flex-grow spacer → footer.
The page should feel like it has room to breathe. If anything feels cramped, add more space, not less.

Writing surface (when you click through):
"back" in bottom-left corner, lowercase, font-size: 0.75rem, color: #A0958A. No arrow icon.
"Finish Letter →" in top-right, same style as the CTA link on landing: plain text, font-size: 0.75rem, color: #2C2824, underline on hover. No button, no background.
The placeholder "type naturally / your rhythm shapes the typography" in #C8BDB2, font-size: 1rem, Inter weight 300.

Replay view:
Background: #1C1915 (very dark warm brown)
Text renders in #E5DCD2
Controls at bottom: plain text links, not icon buttons. "pause" / "2×" / "restart" in #8B7E74, font-size: 0.75rem, letter-spacing: 0.1em. Separated by  ·  (middle dot).
Progress bar: full-width, 1px tall, filled in #B87A5E, track in rgba(255,255,255,0.08).

The test for "finished": Every element on the page should be able to justify its size, position, and color. If something is there by default rather than by choice, remove it or refine it.