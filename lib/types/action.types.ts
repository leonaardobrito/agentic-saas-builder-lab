/**
 * Standard response type for Server Actions.
 * Ensures consistent error handling and type safety across all actions.
 */
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
