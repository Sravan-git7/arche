/**
 * Payment abstraction. No provider is hard-coded — the UI talks to this
 * interface only, so Stripe / Razorpay / another gateway can be connected
 * later by implementing `PaymentProvider` and swapping `activeProvider`.
 */

export type PaymentStatus = "idle" | "pending" | "successful" | "failed" | "cancelled";

export type CheckoutRequest = {
  service: string;
  packageName: string;
  amountLabel: string; // display amount, e.g. "$150 deposit"
  customer: { name: string; email: string };
};

export type CheckoutResult = {
  status: Extract<PaymentStatus, "successful" | "failed" | "cancelled">;
  reference?: string;
  message?: string;
};

export interface PaymentProvider {
  readonly name: string;
  readonly configured: boolean;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
}

/**
 * Placeholder provider used until a real gateway is configured.
 * It never charges anything: it records the intent locally and resolves
 * as "successful" so the full UI flow (pending → result states) can be
 * exercised end-to-end. `configured` is false so the UI can label the
 * step honestly as a reservation rather than a live charge.
 */
const placeholderProvider: PaymentProvider = {
  name: "Placeholder (no gateway connected)",
  configured: false,
  createCheckout(req) {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const log = JSON.parse(localStorage.getItem("arche:intents") || "[]");
          log.push({ ...req, at: new Date().toISOString() });
          localStorage.setItem("arche:intents", JSON.stringify(log));
        } catch {
          /* storage unavailable — fine */
        }
        resolve({
          status: "successful",
          reference: `ARC-${Date.now().toString(36).toUpperCase()}`,
          message: "Reservation recorded. We'll send a payment link to confirm.",
        });
      }, 1400);
    });
  },
};

export const activeProvider: PaymentProvider = placeholderProvider;
