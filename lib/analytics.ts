"use client";

import { track } from "@vercel/analytics";

export function trackAssessmentEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  try {
    track(name, properties);
  } catch {
    // No-op when analytics is not available.
  }
}
