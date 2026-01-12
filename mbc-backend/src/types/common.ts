// ==============================================
// Common Types & Utilities
// ==============================================

// ==============================================
// HTTP & API Common Types
// ==============================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpStatusCode = 
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504; // Gateway Timeout

// ==============================================
// Environment & Configuration
// ==============================================

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
}

export interface RedisConfig {
  url: string;
  maxRetries: number;
  retryDelay: number;
  keyPrefix: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  fromName: string;
}

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  corsOrigin: string | string[];
  jwtSecret: string;
  jwtExpire: string;
  bcryptRounds: number;
  maxFileUpload: number;
  fileUploadPath: string;
  rateLimitMax: number;
  rateLimitWindow: number;
}

// ==============================================
// Utility Types
// ==============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ==============================================
// Date & Time Utilities
// ==============================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  dayOfWeek?: number; // 0-6, Sunday = 0
}

// ==============================================
// File & Media Types
// ==============================================

export interface FileMetadata {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  category: FileCategory;
  metadata?: Record<string, any>;
}

export type FileCategory = 
  | 'assignment'
  | 'submission'
  | 'profile'
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'other';

export interface ImageMetadata extends FileMetadata {
  width: number;
  height: number;
  format: string;
}

// ==============================================
// Validation & Error Types
// ==============================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ==============================================
// Cache Types
// ==============================================

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  tags: string[];
}

// ==============================================
// Event & Notification Types
// ==============================================

export interface SystemEvent {
  id: string;
  type: EventType;
  source: string;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export type EventType = 
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'assignment.created'
  | 'assignment.updated'
  | 'assignment.due'
  | 'submission.created'
  | 'submission.graded'
  | 'attendance.marked'
  | 'notice.created'
  | 'system.maintenance'
  | 'system.error';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: NotificationChannel[];
}

export type NotificationType = 
  | 'assignment_due'
  | 'assignment_graded'
  | 'attendance_marked'
  | 'notice_posted'
  | 'system_alert';

export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';

// ==============================================
// Search & Filter Types
// ==============================================

export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  sort?: SortOption[];
  pagination?: PaginationOptions;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==============================================
// Health Check & Monitoring
// ==============================================

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  services: ServiceHealth[];
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: Date;
}