import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { groupById } from '../data/groups';
import { seedInbox } from '../data/poolInvites';
import { InboxItem, Plan, PlanVote } from '../data/types';

// The crew that votes on a Call It plan — "You + 3" (Decision 009 / Map v3 spec §1.6).
const YOUR_CREW_IDS = groupById('g-you').memberIds;
// Scripted arrival order for the demo — mates vote in one at a time, not all at once.
const VOTE_ORDER = YOUR_CREW_IDS.filter((id) => id !== 'you');

// All demo state is in-memory: every launch is a pristine demo (spec §Demo behaviour).
interface DemoState {
  sentInvites: Record<string, boolean>; // keyed by groupId
  inbox: InboxItem[];
  joined: Record<string, boolean>; // keyed by eventId
  matches: string[]; // userIds matched in the dating deck
  plan: Plan | null;
  sendInvite: (groupId: string) => void;
  respond: (itemId: string, status: 'accepted' | 'denied') => void;
  joinEvent: (eventId: string) => void;
  addMatch: (userId: string) => void;
  callIt: (venueId: string) => void;
  vote: (memberId: string, v: PlanVote) => void;
  clearPlan: () => void;
}

const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [sentInvites, setSentInvites] = useState<Record<string, boolean>>({});
  const [inbox, setInbox] = useState<InboxItem[]>(seedInbox);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [matches, setMatches] = useState<string[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const voteTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearVoteTimers = () => {
    voteTimers.current.forEach(clearTimeout);
    voteTimers.current = [];
  };

  const value = useMemo<DemoState>(
    () => ({
      sentInvites,
      inbox,
      joined,
      matches,
      plan,
      sendInvite: (groupId) => setSentInvites((s) => ({ ...s, [groupId]: true })),
      respond: (itemId, status) =>
        setInbox((items) => items.map((i) => (i.id === itemId ? { ...i, status } : i))),
      joinEvent: (eventId) => setJoined((s) => ({ ...s, [eventId]: true })),
      addMatch: (userId) => setMatches((m) => (m.includes(userId) ? m : [...m, userId])),
      callIt: (venueId) => {
        clearVoteTimers();
        setPlan({ venueId, votes: { you: 'in' }, locked: false });
        // Mates vote in one at a time — the flag visibly rises as the demo watches.
        VOTE_ORDER.forEach((memberId, i) => {
          const t = setTimeout(
            () => setPlan((p) => (p && p.venueId === venueId ? { ...p, votes: { ...p.votes, [memberId]: 'in' } } : p)),
            900 + i * 1100
          );
          voteTimers.current.push(t);
        });
      },
      vote: (memberId, v) => setPlan((p) => (p ? { ...p, votes: { ...p.votes, [memberId]: v } } : p)),
      clearPlan: () => {
        clearVoteTimers();
        setPlan(null);
      },
    }),
    [sentInvites, inbox, joined, matches, plan]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
