import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fixedClock } from '../clock';
import { asBusinessId, asMessageId, asPersonId, asRequestId, asThreadId } from '../ids';
import {
  closeThread,
  isParticipant,
  markRead,
  messagesFor,
  sendMessage,
  SYSTEM,
  threadForRequest,
  threadsFor,
  unreadCount,
  type Message,
} from '../threads';

const NOW = Date.parse('2026-08-09T12:00:00Z');
const clock = fixedClock(NOW);

const GUEST = asPersonId('guest');
const HOST = asBusinessId('biz');
const OUTSIDER = asPersonId('nosy');
const TH = asThreadId('th1');

const thread = threadForRequest(TH, asRequestId('r1'), GUEST, HOST, clock);

const actor = (id: typeof GUEST | typeof HOST | typeof OUTSIDER) =>
  ({ kind: 'actor', id }) as const;

describe('a thread belongs to exactly one request', () => {
  it('starts open with both parties in it', () => {
    assert.equal(thread.status, 'open');
    assert.equal(isParticipant(thread, GUEST), true);
    assert.equal(isParticipant(thread, HOST), true);
    assert.equal(isParticipant(thread, OUTSIDER), false);
  });

  it('carries the request it came from', () => {
    assert.equal(thread.requestId, asRequestId('r1'));
  });
});

describe('who may write', () => {
  it('lets a participant send', () => {
    const result = sendMessage({ id: asMessageId('m1'), thread, sender: actor(GUEST), body: 'on my way' }, clock);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value.message.body, 'on my way');
  });

  it('refuses someone who is not in the thread', () => {
    const result = sendMessage({ id: asMessageId('m2'), thread, sender: actor(OUTSIDER), body: 'hi' }, clock);
    assert.equal(result.ok === false && result.error, 'not_participant');
  });

  it('refuses an empty or whitespace-only message', () => {
    assert.equal(sendMessage({ id: asMessageId('m3'), thread, sender: actor(GUEST), body: '   ' }, clock).ok, false);
  });

  it('trims the body', () => {
    const result = sendMessage({ id: asMessageId('m4'), thread, sender: actor(GUEST), body: '  here  ' }, clock);
    assert.equal(result.ok && result.value.message.body, 'here');
  });

  it('refuses a participant writing into a closed thread', () => {
    const closed = closeThread(thread);
    const result = sendMessage({ id: asMessageId('m5'), thread: closed, sender: actor(GUEST), body: 'still there?' }, clock);
    assert.equal(result.ok === false && result.error, 'thread_closed');
  });

  it('still lets func post a system message as the thread closes', () => {
    // "The host declined" is exactly the message that arrives at closing time.
    const closed = closeThread(thread);
    const result = sendMessage({ id: asMessageId('m6'), thread: closed, sender: SYSTEM, body: 'Nightform said no' }, clock);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value.message.sender.kind, 'system');
  });

  it('never attributes a system message to a participant', () => {
    const result = sendMessage({ id: asMessageId('m7'), thread, sender: SYSTEM, body: 'Nightform accepted' }, clock);
    assert.equal(result.ok && result.value.message.sender.kind, 'system');
    assert.equal(result.ok && result.value.message.readBy.length, 0);
  });
});

describe('reading and ordering', () => {
  const msg = (id: string, sentAt: number, from = actor(GUEST)): Message => ({
    id: asMessageId(id),
    threadId: TH,
    sender: from,
    body: id,
    sentAt,
    readBy: from.kind === 'actor' ? [from.id] : [],
  });

  const all: Message[] = [
    msg('c', NOW + 200),
    msg('a', NOW),
    msg('b', NOW + 100, actor(HOST)),
    { ...msg('other', NOW), threadId: asThreadId('th2') },
  ];

  it('returns only this thread’s messages, oldest first', () => {
    assert.deepEqual(
      messagesFor(all, TH).map((m) => m.body),
      ['a', 'b', 'c'],
    );
  });

  it('counts unread, ignoring your own messages', () => {
    // Guest wrote a and c; host wrote b. The guest has one unread.
    assert.equal(unreadCount(all, TH, GUEST), 1);
    // The host wrote b; a and c are unread to them.
    assert.equal(unreadCount(all, TH, HOST), 2);
  });

  it('clears once read, and marking twice is harmless', () => {
    const read = all.map((m) => (m.body === 'b' ? markRead(m, GUEST) : m));
    assert.equal(unreadCount(read, TH, GUEST), 0);
    const again = read.map((m) => (m.body === 'b' ? markRead(m, GUEST) : m));
    assert.equal(again.find((m) => m.body === 'b')?.readBy.length, 2);
  });

  it('lists an actor’s threads, most recent first', () => {
    const older = { ...thread, id: asThreadId('th0'), lastMessageAt: NOW - 1000 };
    const newer = { ...thread, lastMessageAt: NOW };
    assert.deepEqual(
      threadsFor([older, newer], GUEST).map((t) => t.id),
      [TH, asThreadId('th0')],
    );
  });

  it('does not list threads you are not in', () => {
    assert.deepEqual(threadsFor([thread], OUTSIDER), []);
  });
});
