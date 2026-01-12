/**
 * Frontend Type Definitions
 * Shared types for the MBC Frontend application
 */

// Re-export backend types for consistency
export * from './api';
export * from './auth';
export type {
  // Common types (excluding Permission to avoid conflict)
  ID, Timestamp, Email, URL,
  Optional, RequiredFields, DeepPartial,
  Status, LoadingState,
  BaseResponse, ErrorResponse, SuccessResponse,
  BaseProps, ComponentWithLoading,
  EventHandler, AsyncEventHandler, ChangeHandler, SubmitHandler,
  FormField, FormState,
  SortConfig, FilterConfig, TableState,
  ModalState,
  NotificationType, Notification,
  ThemeMode, ThemeColors,
  NavItem, BreadcrumbItem,
  FileInfo, UploadProgress, FileUploadState,
  SearchResult, SearchOptions,
  DateRange, TimeRange, DateTimeRange,
  ValidationRule, ValidationResult,
  FeatureFlag,
  Environment, AppConfig,
  AppError,
  PerformanceMetrics,
  A11yProps
} from './common';

// Import UserRole for use in this file
import type { UserRole } from './api';

// Frontend-specific types
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  allowedRoles?: UserRole[];
  children?: RouteConfig[];
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType;
  allowedRoles?: UserRole[];
  children?: NavigationItem[];
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

export interface NotificationConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHideDuration: number;
  maxSnack: number;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
  message?: string;
}

export interface ProtectedRouteProps extends BaseComponentProps {
  allowedRoles?: UserRole[];
}

export interface StatCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Form Types
export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string | number; label: string }>;
}

export interface FormProps<T = any> {
  initialValues: T;
  validationSchema?: any; // Yup schema
  onSubmit: (values: T) => Promise<void> | void;
  children: React.ReactNode;
}

// Table Types
export interface TableColumn<T = any> {
  field: keyof T;
  headerName: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (params: { row: T; value: any }) => React.ReactNode;
}

export interface TableProps<T = any> {
  rows: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  selection?: {
    selectedRows: string[];
    onSelectionChange: (selectedRows: string[]) => void;
  };
}

// Dashboard Types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'table' | 'custom';
  size: 'small' | 'medium' | 'large';
  data?: any;
  component?: React.ComponentType<any>;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  layout: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

// Chart Types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'pie' | 'area';
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
}

// File Upload Types
export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onUpload: (files: File[]) => Promise<void>;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  category?: string[];
  [key: string]: any;
}

export interface SearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  loading?: boolean;
}

// Pagination Types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Error Types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

// Modal Types
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  disableBackdropClick?: boolean;
}

// Confirmation Dialog Types
export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'info' | 'warning' | 'error';
}

// Export commonly used types from backend
export type {
  UserRole,
  User,
  Student,
  Professor,
  Course,
  Assignment,
  Notice,
  ApiResponse,
  PaginationParams,
  SortParams,
} from './api';

export type {
  AuthUser,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  TokenPayload,
} from './auth';