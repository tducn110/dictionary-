The landing page feels like a wireframe. It needs to feel like a piece of graphic design. Here are the specific problems and what "designed" looks like.

Problem: there's no visual tension on the page. Everything is the same temperature, the same weight class, the same energy. Designed pages create tension between elements — large vs small, dark vs light, serif vs sans, tight vs loose.

Reference this approach (describe, don't link): Think of a high-end literary magazine cover — The Paris Review, McSweeney's, or a Penguin Classics book jacket. They use ONE dramatic typographic moment (the title), surrounded by quiet, considered supporting elements. The title does all the work. Everything else stays out of its way but is still beautiful at its own scale.

Here's what to change:

The headline needs to be THE moment. Make it bigger — clamp(3rem, 8vw, 6rem). It should feel like it owns the page. Add margin-bottom: 0.5rem (tighter to the subtitle — the headline and subtitle should feel like one unit, not two separate things floating). The Playfair Display italic is right, but push the weight to 500 — give it more ink, more presence. The letters should feel like they were pressed into the page.
"FONT OF INTENT" — make it a real wordmark, not just small text. Set it in Inter weight 600, font-size: 0.75rem, letter-spacing: 0.35em, color: #2C2824 (same as headline, full dark). A wordmark that's too light looks like a mistake. A wordmark that matches the headline color looks intentional.

The demo card needs a distinct material quality. Right now it's a white box on a cream page — there's no material difference. Give it a left border accent: a 3px solid line in #2C2824 (dark brown, not coral) on the left edge only. No other borders. This is a classic editorial design move — a pull-quote indicator. It signals "this is a live example" without needing a label. Also increase the card padding to 2.5rem 3rem — give the text room to breathe inside it.

The CTA "Write Your Letter →" needs to feel like an invitation, not a footnote. Set it in Playfair Display italic (yes, serif for the CTA too), font-size: 1.1rem, color: #2C2824. The arrow → adds direction. Add a subtle underline: border-bottom: 1.5px solid #C4B5A6 with padding-bottom: 2px. On hover, the underline color darkens to #2C2824. This single link should feel like the most inviting thing on the page.

The footer tagline "the letter only a human could write" — treat it like a colophon. Set it in Playfair Display italic, font-size: 0.85rem, color: #8B7E74. This echoes the headline and creates a typographic frame: serif italic at top, serif italic at bottom, sans-serif in between. That's a design SYSTEM, not just styling.

Add one piece of visual punctuation. Between the subtitle and the demo card, add a single horizontal line: width: 2rem, height: 1.5px, background: #2C2824, margin: 2.5rem 0. This tiny element does massive work — it creates a visual pause, separates the "what is this" zone from the "see it in action" zone, and signals that a designer placed it there deliberately. No AI generator adds a 2rem decorative rule.

**The page rhythm should feel
like breathing:
Header (quiet) — 3rem gap
Headline (LOUD) — 0.5rem
Subtitle (soft) — 2.5rem
Horizontal rule — 2.5rem
Demo card (medium, contained) — 2rem
CTA (warm, inviting) — flex spacer
Footer tagline (echo of headline)

Writing surface and replay — leave alone for now. Lock in the landing page first.**