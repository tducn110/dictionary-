Entry 1: Font of Intent
1) Core concept
A writing surface where typing behavior becomes visible in typography.
The final letter is not just text, it is an emotional artifact.

2) Interaction model
#### Writing phase (author)
User types into a focused writing area.
Each character is rendered as a token (e.g., <span data-id="...">a</span>) with style values derived from recent typing behavior.
Behavior signals:
Inter-key interval (IKI): time between printable keydowns
Burst velocity: rolling chars/sec over last N keystrokes
Pause duration: inactivity before next key
Correction intensity: backspace rate / rewrites
Mapping:
slow/hesitant → lighter weight + narrower width + higher transparency
fast/confident → heavier weight + wider width + stronger opacity
pauses → temporary letter-spacing expansion (“breathing” pulse)
deletions/rewrites → retained ghost traces (italic/strikethrough layer)

#### Playback phase (reader)
Reader sees the letter replayed over time:
characters appear in original sequence/timestamps
deletions visibly strike through/remove
pauses animate spacing expansion then settle
Modes:
Live replay (real-time speed)
Condensed replay (e.g., 4x)
Emotion map view (static final with encoded styling)
3) Technical approach
#### Event capture APIs
keydown / beforeinput / input / compositionstart/end (IME-safe)
performance.now() for high-resolution timestamps
requestAnimationFrame for smooth breathing animations
Optional: Selection/Range APIs for mid-text edits (advanced)

#### Data model
session = {
  startedAt,
  events: [
    {t, type:'insert', char, pos, iki, burst, pause},
    {t, type:'delete', pos, deletedChar, correctionScore},
    {t, type:'replace', from, to, ...}
  ],
  finalText
}

Store lightweight timeline JSON for replay/share.

#### Signal processing
IKI normalized via rolling min/max or robust percentile clamp.
Velocity smoothing via EMA:
vSmoothed = alpha * vNow + (1-alpha) * vPrev
Pause score from inactivity buckets (e.g., >600ms, >1500ms).

#### Mapping to variable font axes
Use CSS font-variation-settings per token:
wght (100–900)
wdth (75–125 if supported)
slnt / ital for uncertainty/corrections
optional optical axis if font supports it

Example mapping:
confidence (0..1) from speed + low correction:
wght = 220 + confidence * 580
wdth = 92 + confidence * 16
hesitation (0..1) from pause + erratic timing:
slnt = -2 - hesitation * 8
opacity dip / slight blur on high hesitation tokens

4) Font recommendations (dramatic variable range)
Best practical picks:
Inter Variable – reliable, web-optimized, strong wght axis
Roboto Flex – huge expressive axis set (great for demo wow)
Recursive – mono/sans personality options
Fraunces Variable – expressive editorial mood (if tone fits letter)

Recommendation:
MVP: Inter Variable (fast, stable)
Impressive: Roboto Flex (more emotional mapping possibilities)

5) Visual direction
Calm, editorial, intimate.
Minimal UI chrome.
Big writing canvas with subtle ambient gradient.
“Telemetry sidebar” (optional): confidence meter, pause map, revision count.
Final output feels like a museum artifact of thought.

6) Landing page before typing
Hero: “your words reveal what your fingers felt”
20-second auto demo replay (pre-recorded sample)
2 buttons:
Write your letter
Watch a sample replay
Tiny explanation chips: speed → weight, pause → breath, revision → traces

7) Shareability strategy
Primary: shareable replay URL with encoded timeline JSON
Secondary: export poster PNG (final encoded letter)
Advanced: MP4/GIF replay capture (client-side canvas or lightweight recorder)
Optional: print stylesheet for PDF artifact

8) MVP vs impressive
#### MVP (ship in 1 day)
capture key timings
map speed to weight
map pause to letter-spacing pulse
backspace creates struck ghost
replay mode with typed sequence
shareable URL via compressed JSON

#### Impressive version
richer axes (wght/wdth/slnt)
confidence heatmap timeline scrubber
branching replay (show alternate phrasings before deletions)
cinematic replay camera/zoom moments
export animated artifact

9) Risks / unknowns
Mid-string edits complicate positional replay (can defer by constraining editing model initially).
IME/composition handling can break naive keydown logic.
Per-character spans may affect performance in long text (virtualization/chunking may be needed).
Font licensing/hosting for certain variable fonts.

10) Prioritized build plan
Build event logger + normalized signal pipeline
Render tokenized text with wght mapping
Add pause breathing + deletion traces
Create replay engine from timeline JSON
Add sharing (URL + PNG export)
Polish visual language + onboarding demo