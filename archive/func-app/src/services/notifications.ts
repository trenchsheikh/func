/**
 * Notifications, as an interface.
 *
 * Tier 0: func never rushes you. No streaks, no "your friends are out without
 * you", no manufactured urgency. So the notifiable events are enumerated as a
 * closed union rather than left as a free-form `notify(title, body)` — adding a
 * new reason to interrupt someone should require editing this file and
 * noticing what you are doing.
 *
 * Every one of these is the resolution of something the user themselves
 * started.
 */

import type { AfterPartyId, PassId, PersonId, RequestId, ThreadId } from '../domain/ids';

export type NotificationPermission = 'undetermined' | 'denied' | 'granted';

export type FuncNotification =
  /** A host accepted — one of the four moments the product is built around. */
  | { readonly kind: 'request_accepted'; readonly requestId: RequestId; readonly passId: PassId | null; readonly hostName: string }
  | { readonly kind: 'request_declined'; readonly requestId: RequestId; readonly hostName: string }
  /** You are the host, and someone is waiting on you. */
  | { readonly kind: 'request_received'; readonly requestId: RequestId; readonly guestName: string; readonly partySize: number }
  | { readonly kind: 'message_received'; readonly threadId: ThreadId; readonly senderName: string; readonly preview: string }
  /** The address is live — the payoff of an after-party ask. */
  | { readonly kind: 'after_address_revealed'; readonly afterId: AfterPartyId; readonly hostName: string }
  /**
   * DTF is about to lapse.
   *
   * The one notification not triggered by another person, and the one closest
   * to the line. It is a courtesy — your friends are about to stop seeing you —
   * not a nudge to stay out, and it must never be phrased as one.
   */
  | { readonly kind: 'presence_expiring'; readonly personId: PersonId; readonly minutesLeft: number };

export interface NotificationService {
  getPermission(): Promise<NotificationPermission>;
  requestPermission(): Promise<NotificationPermission>;
  present(notification: FuncNotification): Promise<void>;
  /** Clear anything relating to a thread the user has now opened. */
  dismissFor(threadId: ThreadId): Promise<void>;
}

export class FakeNotificationService implements NotificationService {
  readonly presented: FuncNotification[] = [];
  private permission: NotificationPermission;

  constructor(permission: NotificationPermission = 'granted') {
    this.permission = permission;
  }

  async getPermission(): Promise<NotificationPermission> {
    return this.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (this.permission === 'denied') return this.permission;
    this.permission = 'granted';
    return this.permission;
  }

  async present(notification: FuncNotification): Promise<void> {
    if (this.permission !== 'granted') return;
    this.presented.push(notification);
  }

  async dismissFor(threadId: ThreadId): Promise<void> {
    for (let i = this.presented.length - 1; i >= 0; i--) {
      const entry = this.presented[i];
      if (entry && entry.kind === 'message_received' && entry.threadId === threadId) {
        this.presented.splice(i, 1);
      }
    }
  }

  setPermission(permission: NotificationPermission): void {
    this.permission = permission;
  }
}
