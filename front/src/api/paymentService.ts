import api from "@/lib/api";

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

export const paymentService = {
    initiate: async (data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
        const response = await api.post("/payments/initiate", data);
        return response.data;
    },
};
