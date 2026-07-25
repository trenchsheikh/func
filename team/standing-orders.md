# Standing Orders

**Check this file before starting any build work, enabling automation, or
making a judgment call about what to do next.** Everything here is a live,
founder-issued instruction — not a durable principle (those are in
`operating-principles.md`) and not a permanent fact about Func (those are in
`docs/`). Entries get added, updated, and *removed* as the founder issues new
direction. If an entry no longer reflects reality, delete it — a stale order
is worse than no order.

Format: each entry has an issue date, the order itself, and what would lift
or change it. Newest first.

---

## 🛑 HOLD — no further build work until the Func Bible is complete

- **Issued:** 2026-07-25
- **Order:** The founder is writing the **Func Bible** — a descriptive essay
  defining Func's ultimate vision and how the founder envisions it — before
  the team resumes building. Until it's complete:
  - **Do not** proactively continue the Map v3 build plan
    (`docs/specs/map-v3-social-layer-spec.md` §6, steps 5–11).
  - **Do not** enable or trigger the cloud routine once it exists.
  - **Do not** treat "the founder is away" as license to keep building
    autonomously.
  - **Acceptable work during the hold:** anything the founder directly asks
    for in a live conversation — infra/tooling setup, bug fixes on request,
    discussion, and editing or critiquing a Func Bible draft *if the founder
    asks for that*. The team does not write the Bible; it's founder-authored.
- **Lifts when:** the founder has published the Func Bible (expected home:
  `docs/FUNC_BIBLE.md`) and explicitly says to resume.

## GitHub push + cloud routine — infrastructure prepped, not active

- **Issued:** 2026-07-25
- **Order:** The founder approved pushing the Func repo to a new private
  GitHub repository and setting up a daily cloud-scheduled session (via
  `RemoteTrigger`) to resume the Map v3 build autonomously once the hold
  above lifts. As of this writing:
  - **Blocked on:** the founder running `gh auth login` on this Mac (no
    GitHub CLI or credentials were present). See `team/reviews/` or the
    conversation history for exact setup steps if needed again.
  - **Once auth is confirmed:** create a private repo, push `main`, then
    create the `RemoteTrigger` routine — but leave it **disabled**
    (`enabled: false`) until the Bible-hold above also lifts. Both
    conditions must clear before the routine actually fires.
  - **Known limitation to keep in the routine's prompt:** cloud sessions
    have no access to this Mac — no local Node install, no iOS Simulator, no
    physical phone. They can typecheck, build, and do a browser-level sanity
    check; they cannot do the native verification `operating-principles.md`
    #9 requires. Native verification of cloud-built work still needs a
    session run from this Mac.

## iOS Simulator — ready

- **Issued:** 2026-07-25
- **Status, not an order:** Xcode 26.6 and the iOS 26.5 Simulator runtime are
  fully installed and working on this Mac (five iPhone models available via
  `xcrun simctl`). Native verification per `operating-principles.md` #9 can
  proceed normally once build work resumes. No action needed — noted here so
  a future session doesn't waste time re-diagnosing something already fixed.
