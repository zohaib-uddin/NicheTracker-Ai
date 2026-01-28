
export enum NavItem {
  DASHBOARD = 'Dashboard',
  DISCOVERY = 'Discovery',
  SAVED = 'Saved',
  ACCOUNT = 'Account',
  SETTINGS = 'Settings',
  ADMIN = 'Admin Panel',
  ADD_VIDEO = 'Add Video',
  DETAIL = 'Niche Detail',
  MONETIZATION = 'Monetization Checker',
  CATEGORY = 'Category Feed',
  PAYMENT = 'Payment'
}

export interface UserUsage {
    ai_analysis_used: number; // Daily
    monetization_checks_used: number; // Lifetime for Free, Daily for Pro
    tracked_niches: number;
    last_reset?: string; // Date string for daily reset check
    reset_version?: string; // Version control for forcing credit resets
}

export interface UserSettings {
    email_notifications?: boolean;
    new_video_alerts?: boolean;
    language?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    is_pro: boolean;
    is_admin?: boolean; // New: Admin Flag
    full_name?: string;
    avatar_url?: string;
    plan_interval?: 'monthly' | 'yearly';
    joined_at?: string;
    subscription_start_date?: string; 
    usage?: UserUsage;
    saved_ids?: string[]; 
    settings?: UserSettings; 
}

export interface DeepAnalysis {
  primary_niche: string;
  sub_niche: string;
  targeted_audience?: string; 
  account_age_days: number;
  daily_post_frequency: number; 
  weekly_upload_rate: number; 
  success_rate: number; 
  consistency_score: number; 
  
  upload_heatmap?: { day: string; count: number; intensity: number }[]; 
  most_active_day?: string;

  hook_technique: string; 
  winning_strategy: string; 
  call_to_action_type: string;
  audio_signature: string; 
  caption_seo_strategy: string; 
  editing_pacing: string; 
  
  ideation_source?: string;
  tools_used?: string;
  growth_tactics?: string;
  
  growth_history: { 
      date: string; 
      followers: number; 
      views: number;
      likes: number; 
      comments: number; 
      shares: number; 
  }[];
}

export interface TopVideo {
  video_id: string;
  title: string;
  cover_url: string;
  play_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  create_time: number;
}

export interface AiContentIdea {
  title: string;
  hook: string;
  target_audience: string;
  production_notes: string;
  hashtags: string[];
}

export interface NicheData {
  id: string;
  title: string;
  description: string;
  platform: ('TikTok' | 'YouTube')[];
  views: string;
  growth: string;
  difficulty: 'Low' | 'Medium' | 'High';
  category: string;
  cpm: string;
  trending_score: number;
  keywords: string[]; 
  
  video_id: string; 
  video_platform: 'YouTube' | 'TikTok'; 
  channel_name: string; 
  channel_handle?: string; 
  channel_avatar_url?: string; 
  author_bio?: string; 
  cover_url?: string; 
  
  duration?: number; 
  create_time?: number; 
  region?: string; 
  
  author_stats?: {
    followers: number;
    videos?: number;
    hearts?: number;
    nickname?: string;
    unique_id?: string;
  };

  niche_metrics?: {
    daily_competitor_uploads: number;
    saturation_percentage: number; 
    success_probability: number; 
    avg_niche_engagement: number; 
    
    verdict: string; 
    target_country: string; 
    competitor_ratio: string; 
    viral_potential: number; 
    retention_score: number; 
    trend_longevity: string; 
    
    trend_velocity: number; 
    algo_score: number; 
    audience_power: number; 
    monetization_rating: number; 
    
    content_fatigue?: string; 
    search_volume?: string; 
    keyword_cpc?: string; 
    demographics_age?: string; 
    demographics_gender?: string; 
    hashtag_volume?: string; 
    
    neural_pattern_match?: string; 
    video_engagement_label?: string; 
  };
  
  deep_analysis?: DeepAnalysis;
  top_videos?: TopVideo[];

  engagement: {
    likes: string;
    comments: string;
    shares: string;
  };
  
  // Internal DB ID helper
  _db_id?: string;
}

export interface SidebarProps {
  activeNav: NavItem;
  onNavigate: (item: NavItem) => void;
  onSelectCategory?: (category: string) => void;
  activeCategory?: string;
  isPro: boolean;
  isAdmin?: boolean; 
  onShowUnlock: () => void;
  mobileOpen?: boolean; // New
  onMobileClose?: () => void; // New
}

export interface NicheCardProps {
  data: NicheData;
  onClick: () => void;
  isSaved?: boolean;
  onToggleSave?: (id: string, data: NicheData) => void;
  isAdmin?: boolean; 
  onDelete?: (id: string) => void; 
}

export interface FilterState {
    platform: 'All' | 'TikTok' | 'YouTube';
    timeRange: 'All' | '7d' | '30d';
    minViews: string;
    maxViews: string;
    minFollowers: string;
    maxFollowers: string;
    dateAfter: string;
    dateBefore: string;
}

export interface HeaderProps {
  activeNav: NavItem;
  onNavigate: (item: NavItem) => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
  user: UserProfile | null;
  onLogout: () => void;
  language?: string;
  translations?: any;
  onMobileMenuToggle?: () => void; // New
}

export interface AdminPanelProps {
  onAddNiche: (niche: NicheData, preventRedirect?: boolean) => void;
}
