/** Shared display defaults — server still enforces MAX_UPLOAD_MB. */
export const DEFAULT_MAX_UPLOAD_MB = Number(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? process.env.MAX_UPLOAD_MB ?? 250,
);

export function maxUploadLabelFromConfig(): string {
  return `${DEFAULT_MAX_UPLOAD_MB} MB`;
}
