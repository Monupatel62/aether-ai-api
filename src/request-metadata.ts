export interface ApiRequestMetadata {
  readonly requestId: string;
  readonly correlationId: string;
}

export interface ApiRequestMetadataInput {
  readonly requestId?: string;
  readonly correlationId?: string;
}

/** Accept only bounded opaque IDs; generate replacements upstream when headers are missing/invalid. */
export function validateRequestMetadata(input: ApiRequestMetadataInput): ApiRequestMetadata | undefined {
  const valid = (value: unknown): value is string =>
    typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
  if (input.requestId !== undefined && !valid(input.requestId)) return undefined;
  if (input.correlationId !== undefined && !valid(input.correlationId)) return undefined;
  if (input.requestId === undefined || input.correlationId === undefined) return undefined;
  return Object.freeze({ requestId: input.requestId, correlationId: input.correlationId });
}
