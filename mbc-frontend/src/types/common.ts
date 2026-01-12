/**
 * Common Types
 * Shared utility types and interfaces
 */

import React from 'react';

// Base Types
export type ID = string;
export type Timestamp = string;
export type Email = string;
export type URL = string;

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Status Types
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type LoadingState = 'idle' | 'pending' | 'fulfilled' | 'rejected';

// Generic Response Types
export interface BaseResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SuccessResponse<T = any> extends BaseResponse {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Component Base Types
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface ComponentWithLoading extends BaseProps {
  loading?: boolean;
  disabled?: boolean;
}

// Event Handler Types
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;
export type ChangeHandler<T = any> = (value: T) => void;
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>;

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };
  options?: Array<{ value: any; label: string; disabled?: boolean }>;
  multiple?: boolean;
  accept?: string; // for file inputs
}

export interface FormState<T = any> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Table Types
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';
  value: any;
}

export interface TableState {
  page: number;
  pageSize: number;
  sort?: SortConfig;
  filters: FilterConfig[];
  selectedRows: string[];
}

// Modal Types
export interface ModalState {
  isOpen: boolean;
  data?: any;
  mode?: 'create' | 'edit' | 'view' | 'delete';
}

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  disabled?: boolean;
  children?: NavItem[];
  onClick?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

// File Types
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadState {
  file: File;
  progress: UploadProgress;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: any;
}

// Search Types
export interface SearchResult<T = any> {
  items: T[];
  total: number;
  query: string;
  filters?: Record<string, any>;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface SearchOptions {
  query?: string;
  filters?: Record<string, any>;
  sort?: SortConfig;
  page?: number;
  pageSize?: number;
  facets?: string[];
}

// Date/Time Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export interface DateTimeRange {
  start: Date;
  end: Date;
}

// Chart/Analytics Types
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'donut';
  title?: string;
  subtitle?: string;
  xAxis?: {
    title?: string;
    type?: 'category' | 'datetime' | 'numeric';
    categories?: string[];
  };
  yAxis?: {
    title?: string;
    min?: number;
    max?: number;
  };
  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  colors?: string[];
  responsive?: boolean;
}

// Validation Types
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any) => string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Permission Types
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  context?: Record<string, any>;
}

// Feature Flag Types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  conditions?: Record<string, any>;
}

// Environment Types
export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  environment: Environment;
  apiUrl: string;
  version: string;
  features: Record<string, boolean>;
  theme: ThemeConfig;
}

// Error Types
export interface AppError extends Error {
  code?: string;
  status?: number;
  details?: any;
  timestamp?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: React.ErrorInfo;
}

// Performance Types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
}

// Accessibility Types
export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Generic Utility Types
export type Awaited<T> = T extends Promise<infer U> ? U : T;
export type NonNullable<T> = T extends null | undefined ? never : T;
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
export type ReadonlyDeep<T> = { readonly [P in keyof T]: ReadonlyDeep<T[P]> };

// Function Types
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;
export type Predicate<T> = (value: T) => boolean;
export type Mapper<T, U> = (value: T) => U;
export type Reducer<T, U> = (accumulator: U, current: T) => U;

// State Management Types
export interface StoreState {
  loading: boolean;
  error: string | null;
  data: any;
}

export interface StoreActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData: (data: any) => void;
  reset: () => void;
}

export interface Store<T = any> extends StoreState {
  data: T;
}

// Hook Return Types
export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

export interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  setValue: (value: boolean) => void;
}