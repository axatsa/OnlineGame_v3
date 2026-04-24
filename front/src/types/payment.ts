export type Plan = "pro" | "school";
export type PaymentMethod = "payme" | "click";

export interface InitiatePaymentRequest {
  plan: Plan;
  method: PaymentMethod;
}

export interface InitiatePaymentResponse {
  redirect_url: string;
  payment_id: string;
}
