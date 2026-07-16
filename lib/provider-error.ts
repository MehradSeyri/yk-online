import type { Provider } from "./types";

export type SanitizedProviderError = {
  status?: number | string;
  message?: string;
  eventId?: string;
};

type ProviderCreateErrorInput = {
  provider: Provider;
  httpStatus?: number;
  providerStatus?: number | string;
  message: string;
  eventId?: string;
};

export class ProviderCreateError extends Error {
  provider: Provider;
  httpStatus?: number;
  providerStatus?: number | string;
  eventId?: string;

  constructor(input: ProviderCreateErrorInput) {
    super(input.message);
    this.name = "ProviderCreateError";
    this.provider = input.provider;
    this.httpStatus = input.httpStatus;
    this.providerStatus = input.providerStatus;
    this.eventId = input.eventId;
  }
}

export function isProviderCreateError(
  err: unknown
): err is ProviderCreateError {
  return err instanceof ProviderCreateError;
}

export function sanitizeProviderError(
  err: ProviderCreateError
): SanitizedProviderError {
  return {
    status: err.providerStatus ?? err.httpStatus,
    message: err.message,
    eventId: err.eventId,
  };
}
