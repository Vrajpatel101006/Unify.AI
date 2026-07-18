/** Generic result status for operations. */
export const ResultStatus = {
  Success: 'success',
  Error: 'error',
  Cancelled: 'cancelled',
  Pending: 'pending',
} as const;

export type ResultStatus = typeof ResultStatus[keyof typeof ResultStatus];
