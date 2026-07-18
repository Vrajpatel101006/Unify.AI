/**
 * @unify/shared
 *
 * Cross-cutting types, constants, enums, and utility functions
 * shared across all Unify.AI packages.
 */

// Constants
export { APP_NAME, APP_VERSION, DEFAULT_PORTS } from './constants/app';

// Enums
export { ResultStatus } from './enums/ResultStatus';

// Types
export type { Result, PagedResult, ErrorInfo } from './types/common';

// Utils
export { generateId, debounce, throttle } from './utils/helpers';
