export type Plan = 'active' | 'lazy';
export type MemberStatus = 'pending_payment' | 'active';
export type PaymentType = 'initial' | 'monthly';
export type PaymentStatus = 'pending' | 'confirmed';
export type PlanChangeStatus = 'pending' | 'approved' | 'rejected';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export interface DBMember {
  id: string;
  name: string;
  emoji: string;
  password: string;
  plan: Plan;
  streak: number;
  max_streak: number;
  streak_month: string;
  has_penalty_message: boolean;
  status: MemberStatus;
  created_at: string;
}

export interface DBDailyRecord {
  id: string;
  member_id: string;
  date: string;
  weight: number | null;
  distance: number | null;
  submitted_at: string;
}

export interface DBMealRecord {
  id: string;
  member_id: string;
  date: string;
  time: string;
  meal_type: MealType;
  description: string;
  created_at: string;
}

export interface DBPayment {
  id: string;
  member_id: string;
  amount: number;
  type: PaymentType;
  billing_month: string | null;
  status: PaymentStatus;
  confirmed_at: string | null;
  created_at: string;
}

export interface DBPlanChangeRequest {
  id: string;
  member_id: string;
  from_plan: Plan;
  to_plan: Plan;
  status: PlanChangeStatus;
  effective_month: string | null;
  created_at: string;
}

export const getMonthlyCost = (member: Pick<DBMember, 'plan' | 'streak'>): number => {
  if (member.plan === 'lazy') return 600;
  return Math.max(0, 1000 - member.streak * 20);
};

export const PLAN_LABELS: Record<Plan, string> = {
  active: 'がんばるプラン',
  lazy:   'サボっても大丈夫プラン',
};
