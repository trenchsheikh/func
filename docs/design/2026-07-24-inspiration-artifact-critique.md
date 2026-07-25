# Critique — Inspiration Artifact ("FUNC. Nightlife OS · Plots × Great Gatsby")

Source: founder-supplied public artifact (React mock, four panes). Full source read and
inventoried by the team, 2026-07-24. Treated as inspiration, not specification, per
founder directive.

## What it is

A private-members-club take on Func: gold-on-emerald, serif ritual copy ("The
Register", "Divide the Spoils", "The Night Book"), four panes (Discover / Party /
After / Profile), with venue cards, an abstract "Room" heatmap, story rings, a
vouch-gated table-joining flow, a full booking + bill-splitting flow, promoter
channels, a night archive, invite codes and premium gates.

## What makes it compelling (steal these as *mechanics*, not aesthetics)

1. **Trust is a mechanic, not a page.** Vouches gate a real action (joining a
   stranger's table: "Vouch or 2 mutuals to unlock") and standing is visible
   everywhere a person appears. Reputation that *does* something is reputation
   people care about.
2. **Friends are earned, not added.** Completing a real night together adds your
   party to your circle. The social graph is built from verified real-world
   behaviour — that is a genuinely next-generation social-network primitive.
3. **The full night lifecycle in one product**: discover → book → split the bill →
   party thread → after-hours story → archive. The bill-split ("Divide the Spoils")
   is simultaneously a retention hook and a viral loop (everyone at the table needs
   the app).
4. **Stories that convert.** Place-tagged stories with a reply bar and a "Join" CTA —
   ephemeral content whose purpose is to *produce a meetup*, not harvest views.
5. **In-world language discipline.** Every label is in character. This is why the
   mock feels like a brand instead of a template. Func's equivalent voice is
   neon-street, not Gatsby-gold — but the discipline transfers.
6. **Monetisation woven into flows** (host channel, exposure, concierge ladder)
   rather than bolted on.

## Where it is weak (fix, don't copy)

1. **The map is an afterthought** — an abstract radial "room" with five dots. No
   city, no world, no pan/zoom, no stories or friends on the map. Directly conflicts
   with our map-first directive; our shipped map v2 is already ahead.
2. **M/F ratio telemetry** on venue cards is an ethics, brand and app-store landmine
   (gender-ratio surveillance; incentivises the wrong behaviour). Replace with
   music/energy/vibe signals that carry the same "is tonight my scene" information.
3. **Ultra-luxury skew** ($850–$1,500 minimums, $320 ringers, $400 concierge) —
   bottle-service culture is a niche. Func's market is mainstream 18–26 (£8 entries,
   £20–47 nights). The *mechanics* (trust gates, split pay, host line) generalise;
   the price points must not.
4. **No group-to-group.** Its joining model is individual→table. The Pool
   (groups-meet-groups) remains Func's hero and is fully compatible with the
   artifact's trust gating.
5. **Stories live in a ring at the top of a list** — not integrated with the map,
   which is exactly what the founder has asked us to solve.
6. **Invite-code scarcity** creates launch buzz but fights scale; if used, it must
   be a launch tactic, not an architecture.

## Verdict

Adopt: trust-gated actions, earned friendship, night lifecycle + bill-split,
story→meetup conversion, language discipline. Reject: the map's afterthought status,
gender telemetry, luxury-only economics, separate-surface stories. The Map v3
design work (in progress) integrates the adopted mechanics into Func's neon,
group-first, map-centred identity.
