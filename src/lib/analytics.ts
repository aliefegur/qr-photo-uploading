// src/lib/analytics.ts
import {getApp, getApps} from "firebase/app";
import {type Analytics, getAnalytics, isSupported, logEvent,} from "firebase/analytics";

// logEvent'in 3. parametresinin tipini doğrudan çıkarıyoruz
export type AnalyticsEventParams = Parameters<typeof logEvent>[2];

let analyticsInstance: Analytics | null = null;

export async function initAnalytics(): Promise<Analytics | null> {
  // SSR guard
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;

  try {
    const app = getApps().length ? getApp() : null;
    if (!app) return null;
    if (await isSupported()) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch {
    // desteklenmeyen platform / app yok vs. → sessizce no-op
  }
  return null;
}

/**
 * GA4 event gönderimi — typesafe, any yok.
 * Örnek: track("button_click", { button_id: "upload", value: 1 })
 */
export async function track(
  name: string,
  params?: AnalyticsEventParams
): Promise<void> {
  const a = await initAnalytics();
  if (!a) return;
  logEvent(a, name, params);
}
