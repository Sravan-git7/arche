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

/** Fail closed until a real provider is configured. A local placeholder must
 * never report a reservation or payment as successful. */
const placeholderProvider: PaymentProvider = {
  name: "Not configured",
  configured: false,
  async createCheckout(_req) {
    return { status: "failed", message: "Payments are not configured. Contact the studio to discuss the project." };
  },
};

export const activeProvider: PaymentProvider = placeholderProvider;
