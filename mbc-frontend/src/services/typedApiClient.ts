import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { ApiResponse, ApiError } from '../types/api';

// Enhanced type-safe API client configuration
interface TypedApiClientConfig {
  baseURL?: string;
  timeout?: number;
  getToken: () => string | null;
  onUnauthorized?: () => void;
  onError?: (error: ApiError) => void;
}

// Generic API method types
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestConfig<TData = any> extends Omit<AxiosRequestConfig, 'data'> {
  data?: TData;
}

// Type-safe API client class
export class TypedApiClient {
  private instance: AxiosInstance;
  private config: TypedApiClientConfig;

  constructor(config: TypedApiClientConfig) {
    this.config = config;

    this.instance = axios.create({
      baseURL: config.baseURL || '/api/v1',
      timeout: config.timeout || 20000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config: any): any => {
        try {
          const token = this.config.getToken();
          if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (err) {
          console.debug('Token retrieval failed:', err);
        }
        return config;
      },
      (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse => response,
      (error: AxiosError): Promise<ApiError> => {
        const apiError = this.handleError(error);

        if (apiError.status === 401 && this.config.onUnauthorized) {
          this.config.onUnauthorized();
        }

        if (this.config.onError) {
          this.config.onError(apiError);
        }

        return Promise.reject(apiError);
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with non-2xx status
      return {
        status: error.response.status,
        message: (error.response.data as any)?.message || `HTTP ${error.response.status}: ${error.response.statusText}`,
        data: error.response.data,
        code: (error.response.data as any)?.code || `HTTP_${error.response.status}`,
        timestamp: new Date().toISOString(),
      };
    } else if (error.request) {
      // Request was made but no response
      return {
        status: 0,
        message: 'Network error - no response received',
        code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString(),
      };
    } else {
      // Something else happened
      return {
        status: 0,
        message: error.message || 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Generic typed request method
  private async request<TResponse = any, TData = any>(
    method: ApiMethod,
    url: string,
    config?: RequestConfig<TData>
  ): Promise<ApiResponse<TResponse>> {
    try {
      const response = await this.instance.request<ApiResponse<TResponse>>({
        method,
        url,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw error; // Re-throw the processed error from interceptor
    }
  }

  // Typed HTTP methods
  async get<TResponse = any>(
    url: string,
    config?: Omit<RequestConfig, 'data'>
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('GET', url, config);
  }

  async post<TResponse = any, TData = any>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig<TData>, 'data'>
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse, TData>('POST', url, { ...config, data });
  }

  async put<TResponse = any, TData = any>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig<TData>, 'data'>
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse, TData>('PUT', url, { ...config, data });
  }

  async patch<TResponse = any, TData = any>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig<TData>, 'data'>
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse, TData>('PATCH', url, { ...config, data });
  }

  async delete<TResponse = any>(
    url: string,
    config?: Omit<RequestConfig, 'data'>
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('DELETE', url, config);
  }

  // File upload method
  async uploadFile<TResponse = any>(
    url: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<TResponse>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    return this.request<TResponse, FormData>('POST', url, {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Batch requests
  async batch<TResponse = any>(
    requests: Array<{
      method: ApiMethod;
      url: string;
      data?: any;
      config?: RequestConfig;
    }>
  ): Promise<Array<ApiResponse<TResponse> | ApiError>> {
    const promises = requests.map(({ method, url, data, config }) =>
      this.request<TResponse>(method, url, { ...config, data }).catch((error: ApiError) => error)
    );

    return Promise.all(promises);
  }

  // Health check
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      await this.get('/health');
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<TypedApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): TypedApiClientConfig {
    return { ...this.config };
  }
}


// Default instance
export const typedApiClient = new TypedApiClient({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  getToken: () => null, // Will be updated by useAuthStore
  onUnauthorized: () => {
    // Redirection is now handled in authStore.ts updateConfig
  },
  onError: (error: ApiError) => {
    // Log errors for debugging
    console.error('API Error:', error);
  },
});

export default typedApiClient;