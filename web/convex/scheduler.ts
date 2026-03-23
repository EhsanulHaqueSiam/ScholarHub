/**
 * Scheduler helper that avoids convex-test transaction leaks in unit tests.
 *
 * In production/dev Convex runtime this always schedules normally.
 * In vitest/edge-runtime tests, convex-test can throw unhandled
 * "Write outside of transaction ... _scheduled_functions" errors when
 * runAfter writes land after the test transaction closes.
 */
export async function runAfterSafe(
  ctx: { scheduler: { runAfter: (delayMs: number, fn: any, args: any) => Promise<any> } },
  delayMs: number,
  fn: any,
  args: any,
): Promise<void> {
  if (
    typeof process !== "undefined" &&
    (process.env.VITEST === "true" || process.env.NODE_ENV === "test")
  ) {
    return;
  }

  await ctx.scheduler.runAfter(delayMs, fn, args);
}
