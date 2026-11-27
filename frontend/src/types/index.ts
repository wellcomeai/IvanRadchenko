export type UUID = string;

export type UserRole = "admin" | "user";

export interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface User {
  id: UUID;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  trial_ends_at: string | null;
  created_at: string;
  profile?: UserProfile | null;
}

export interface AuthConfig {
  /** Почта настроена: регистрация с кодом из письма, работает сброс пароля. */
  email_enabled: boolean;
  captcha: "altcha" | null;
}

export interface AltchaChallenge {
  algorithm: string;
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  pending_verification?: boolean;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "cancelled"
  | "expired"
  | "past_due";

export interface Plan {
  id: UUID;
  name: string;
  price: string;
  currency: string;
  interval: "month" | "year";
  features: string[];
  sort_order: number;
}

export interface Subscription {
  id: UUID;
  plan_id: UUID | null;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
}

export interface Payment {
  id: UUID;
  amount: string;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  provider: "robokassa" | "stripe";
  created_at: string;
  /** Что оплачено: «Весь курс», «Модуль 2». */
  title: string;
}

export interface ReferralStats {
  total_referred: number;
  converted: number;
  total_earned: string;
  pending_payout: string;
}

export interface MyReferralCode {
  code: string;
  url: string;
  stats: ReferralStats;
}

export interface ReferralPayout {
  id: UUID;
  amount: string;
  status: "pending" | "approved" | "paid" | "rejected";
  paid_at: string | null;
  created_at: string;
}

export interface ApiKey {
  id: UUID;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKey {
  full_key: string;
}

export interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  mrr: string;
  pending_payouts: string;
}

export interface ReferralUser {
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: "registered" | "trial" | "converted";
  created_at: string;
}

// ---------- Курс ----------

export type MaterialKind = "video" | "file";

export interface LessonMaterial {
  id: UUID;
  kind: MaterialKind;
  title: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  is_uploaded: boolean;
  position: number;
  created_at: string;
  /** Временная ссылка на просмотр или скачивание. */
  url: string | null;
}

/** completed — пройден; available — открыт; locked_sequence — сначала предыдущие; locked_payment — не оплачен. */
export type LessonStatus = "completed" | "available" | "locked_sequence" | "locked_payment";

export interface LessonBrief {
  id: UUID;
  module_id: UUID;
  title: string;
  position: number;
  is_published: boolean;
  has_video: boolean;
  status: LessonStatus;
  is_free: boolean;
}

export interface Lesson extends LessonBrief {
  description: string;
  created_at: string;
  updated_at: string;
  materials: LessonMaterial[];
}

export interface LessonView extends Lesson {
  module_title: string;
  module_position: number;
  prev_lesson_id: UUID | null;
  next_lesson_id: UUID | null;
  completed_at: string | null;
}

export interface CourseModule {
  id: UUID;
  position: number;
  title: string;
  description: string;
  price: string;
  lessons: LessonBrief[];
  /** До какого числа модуль доступен; null — не оплачен. */
  access_until: string | null;
  completed_count: number;
}

export interface AdminCourseModule extends Omit<CourseModule, "lessons"> {
  lessons: Lesson[];
}

export interface ProgramModule {
  position: number;
  title: string;
  description: string;
  lesson_count: number;
}

export interface StorageStatus {
  enabled: boolean;
  bucket: string | null;
}

// ---------- Продажа курса ----------

export type BuyBlock = "owned" | "need_previous" | "included_in_course";

export interface ShopModule {
  id: UUID;
  position: number;
  title: string;
  price: string;
  access_until: string | null;
  can_buy: boolean;
  blocked_by: BuyBlock | null;
}

export interface Shop {
  access_days: number;
  full_course: { price: string; access_until: string | null; can_buy: boolean };
  modules: ShopModule[];
}

export interface PublicPricing {
  full_price: string;
  access_days: number;
  modules: ShopModule[];
}

export interface CourseSettings {
  full_price: string;
  access_days: number;
}

export interface CourseAccess {
  id: UUID;
  module_id: UUID | null;
  module_position: number | null;
  starts_at: string;
  expires_at: string;
  source: "payment" | "admin" | string;
  revoked_at: string | null;
  is_active: boolean;
}

export interface StudentRow {
  id: UUID;
  email: string;
  name: string | null;
  created_at: string;
  full_course_until: string | null;
  modules_paid: number[];
  completed_lessons: number;
  total_lessons: number;
  last_lesson_title: string | null;
  last_activity_at: string | null;
}

export interface StudentLesson {
  id: UUID;
  title: string;
  position: number;
  status: LessonStatus;
  first_opened_at: string | null;
  last_opened_at: string | null;
  completed_at: string | null;
}

export interface StudentDetail {
  row: StudentRow;
  accesses: CourseAccess[];
  modules: {
    id: UUID;
    position: number;
    title: string;
    access_until: string | null;
    lessons: StudentLesson[];
  }[];
}
