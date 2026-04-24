export type Section = "dashboard" | "teachers" | "organizations" | "ai-monitor" | "finances" | "system";

export type Teacher = {
  id: number;
  name: string;
  login: string;
  school: string;
  status: string;
  lastLogin: string;
  plan: string;
  tokenUsage: number;
  ip: string;
  is_active: boolean;
  tokens_limit: number;
  expires_at: string | null;
};

export type Org = {
  id: number;
  name: string;
  contact: string;
  seats: number;
  used: number;
  expires: string;
  status: string;
  plan?: string;
};

export type Payment = {
  id: number;
  org: string;
  amount: number;
  currency: string;
  date: string;
  method: string;
  status: "paid" | "pending" | "failed";
  period: string;
};

export type FinancialStats = {
  mrr: number;
  total_revenue: number;
  active_subscriptions: number;
  pending_payments: number;
};

export type AuditLog = {
  id: number;
  timestamp: string;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  changes?: Record<string, unknown>;
  ip_address?: string;
};
