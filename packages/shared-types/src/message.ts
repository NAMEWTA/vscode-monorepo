/**
 * Message protocol types for extension ↔ webview communication.
 * Implements a typed, bidirectional message envelope pattern.
 */

/** Base message envelope — all messages conform to this shape */
export interface MessageEnvelope<TType extends string = string, TPayload = unknown> {
  /** Message type discriminant */
  type: TType;
  /** Message payload */
  payload: TPayload;
  /** Unique correlation ID for request/response pairing */
  id?: string;
  /** Timestamp of message creation */
  timestamp: number;
}

/** Request message sent from webview → extension */
export interface RequestMessage<TType extends string = string, TPayload = unknown>
  extends MessageEnvelope<TType, TPayload> {
  id: string;
  direction: 'request';
}

/** Response message sent from extension → webview */
export interface ResponseMessage<TType extends string = string, TPayload = unknown>
  extends MessageEnvelope<TType, TPayload> {
  id: string;
  direction: 'response';
  error?: {
    code: string;
    message: string;
  };
}

/** One-way notification (no response expected) */
export interface NotificationMessage<TType extends string = string, TPayload = unknown>
  extends MessageEnvelope<TType, TPayload> {
  direction: 'notification';
}

/** Handler function for processing a message */
export type MessageHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
) => TResult | Promise<TResult>;
