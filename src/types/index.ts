export type AgentId =
  | 'thomas'
  | 'marie'
  | 'lucas'
  | 'emma'
  | 'maxime'
  | 'lea'
  | 'antoine'
  | 'nathalie'
  | 'sofia';

export type AgentStatus = 'online' | 'busy' | 'idle' | 'offline';

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  model: string;
  maxTokens?: number;
  systemPrompt: string;
  /** Agent désactivé : grisé dans le dashboard, cron associé retiré. */
  disabled?: boolean;
}

export interface AgentStat {
  agent_id: AgentId;
  tasks_completed: number;
  tasks_pending: number;
  tasks_failed: number;
  total_tokens_used: number;
  last_active: string | null;
  performance_score: number;
}

export interface ActivityLog {
  id: string;
  agent_id: AgentId;
  agent_name: string;
  action: string;
  details: Record<string, unknown>;
  status: 'success' | 'error' | 'pending';
  duration_ms: number | null;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  seo_keywords: string[];
  meta_description: string;
  category: string;
  categories: string[];
  status: 'draft' | 'published' | 'archived';
  reading_time: number;
  image_url?: string | null;
  image_alt?: string | null;
  image_credit?: string | null;
  image_credit_url?: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  comment_count?: number;
  /** Questions/réponses SEO (longue traîne + JSON-LD FAQPage). */
  faq?: { q: string; a: string }[] | null;
}

export interface SecurityLog {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  endpoint: string | null;
  method: string | null;
  threat_level: ThreatLevel;
  threat_type: string | null;
  action_taken: string | null;
  blocked: boolean;
  details: Record<string, unknown>;
  created_at: string;
}

export interface SocialPost {
  id: string;
  content: string;
  platform: 'instagram' | 'facebook' | 'tiktok';
  hashtags: string[];
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at: string | null;
  published_at: string | null;
  engagement_score: number;
  created_at: string;
}

export interface FinancialReport {
  id: string;
  period: string;
  revenue: number;
  expenses: number;
  margin: number;
  details: Record<string, unknown>;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  status: 'active' | 'unsubscribed';
  source: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  preview_text: string | null;
  content_html: string;
  status: 'draft' | 'sent' | 'failed';
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
}

export interface AdoptionPost {
  id: string;
  poster_name: string;
  email: string;
  animal_type: string;
  breed: string | null;
  age: string | null;
  gender: string;
  region: string;
  description: string;
  reason: string | null;
  contact_info: string;
  photo_urls: string[];
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: 'user' | 'cron' | 'admin' | null;
  deleted_reason: 'adopted' | 'error' | 'auto_expired' | 'admin' | null;
}

export interface AwinProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  affiliate_url: string;
  merchant_name: string;
  category: 'chiens' | 'chats' | 'oiseaux' | 'rongeurs' | 'reptiles' | 'livres' | 'general';
  categories: string[];
  product_type?: string | null;
  last_synced: string;
  ean?: string | null;
  isbn?: string | null;
  brand?: string | null;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string;
  blocked_at: string;
  expires_at: string | null;
  is_permanent: boolean;
}

export interface AgentTaskRequest {
  task: string;
  context?: Record<string, unknown>;
}

export interface AgentTaskResult {
  success: boolean;
  content: string;
  tokens_used: number;
  duration_ms: number;
  data?: Record<string, unknown>;
  error?: string;
}

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalArticles: number;
  totalTasks: number;
  recentActivity: ActivityLog[];
  agentStats: AgentStat[];
}
