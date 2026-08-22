/**
 * Threads and messages.
 *
 * Tier 0 constrains this hard: func is a bridge to the night, not a place the
 * conversation lives. It "does not host the conversation, run the debate, or
 * replace WhatsApp."
 *
 * So a thread is not a chat. It is the correspondence attached to exactly one
 * request, it exists only because someone asked a host for something, and it
 * closes when that request resolves against them. There is deliberately no way
 * to start one — `openThread` is not exported, because a thread with no request
 * behind it would be the first step toward general-purpose messaging.
 */

import type { Clock, Timestamp } from './clock';
import type { ActorId, MessageId, RequestId, ThreadId } from './ids';

export type ThreadStatus = 'open' | 'closed';

export interface Thread {
  readonly id: ThreadId;
  readonly requestId: RequestId;
  readonly participantIds: readonly ActorId[];
  readonly status: ThreadStatus;
  readonly createdAt: Timestamp;
  readonly lastMessageAt: Timestamp;
}

/**
 * `system` marks a message func wrote itself ("Nightform accepted"), which is
 * never attributable to a participant and must never look like one.
 */
export type Sender = { readonly kind: 'actor'; readonly id: ActorId } | { readonly kind: 'system' };

export const SYSTEM: Sender = { kind: 'system' };

export interface Message {
  readonly id: MessageId;
  readonly threadId: ThreadId;
  readonly sender: Sender;
  readonly body: string;
  readonly sentAt: Timestamp;
  readonly readBy: readonly ActorId[];
}

export type ThreadError = 'not_participant' | 'thread_closed' | 'empty_message';

export type ThreadResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ThreadError };

/**
 * Create the thread that accompanies a new request.
 *
 * Called only from the request flow — never on its own.
 */
export function threadForRequest(
  id: ThreadId,
  requestId: RequestId,
  guestId: ActorId,
  hostId: ActorId,
  clock: Clock,
): Thread {
  const now = clock.now();
  return {
    id,
    requestId,
    participantIds: [guestId, hostId],
    status: 'open',
    createdAt: now,
    lastMessageAt: now,
  };
}

export function isParticipant(thread: Thread, actorId: ActorId): boolean {
  return thread.participantIds.some((id) => (id as string) === (actorId as string));
}

export interface SendMessageInput {
  readonly id: MessageId;
  readonly thread: Thread;
  readonly sender: Sender;
  readonly body: string;
}

export function sendMessage(
  input: SendMessageInput,
  clock: Clock,
): ThreadResult<{ readonly message: Message; readonly thread: Thread }> {
  const body = input.body.trim();
  if (!body) return { ok: false, error: 'empty_message' };

  // System messages are written by func itself and must still land on a closed
  // thread — "the host declined" is exactly the message that arrives as it
  // closes.
  if (input.sender.kind === 'actor') {
    if (!isParticipant(input.thread, input.sender.id)) {
      return { ok: false, error: 'not_participant' };
    }
    if (input.thread.status === 'closed') return { ok: false, error: 'thread_closed' };
  }

  const now = clock.now();
  return {
    ok: true,
    value: {
      message: {
        id: input.id,
        threadId: input.thread.id,
        sender: input.sender,
        body,
        sentAt: now,
        readBy: input.sender.kind === 'actor' ? [input.sender.id] : [],
      },
      thread: { ...input.thread, lastMessageAt: now },
    },
  };
}

/** Close a thread — its request was declined, cancelled, or has passed. */
export const closeThread = (thread: Thread): Thread => ({ ...thread, status: 'closed' });

export function messagesFor(
  messages: readonly Message[],
  threadId: ThreadId,
): readonly Message[] {
  return messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.sentAt - b.sentAt);
}

export function threadsFor(
  threads: readonly Thread[],
  actorId: ActorId,
): readonly Thread[] {
  return threads
    .filter((t) => isParticipant(t, actorId))
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

export function markRead(message: Message, actorId: ActorId): Message {
  if (message.readBy.some((id) => (id as string) === (actorId as string))) return message;
  return { ...message, readBy: [...message.readBy, actorId] };
}

/** Messages in a thread the actor has not read, excluding their own. */
export function unreadCount(
  messages: readonly Message[],
  threadId: ThreadId,
  actorId: ActorId,
): number {
  return messagesFor(messages, threadId).filter((m) => {
    if (m.sender.kind === 'actor' && (m.sender.id as string) === (actorId as string)) return false;
    return !m.readBy.some((id) => (id as string) === (actorId as string));
  }).length;
}
