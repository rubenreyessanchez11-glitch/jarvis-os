import type { IncomingMessage, ServerResponse } from 'node:http';

export type Request = IncomingMessage & { body?: unknown };
export type Response = ServerResponse & {
  status(code: number): Response;
  json(body: unknown): void;
};
