import axios, { type InternalAxiosRequestConfig } from 'axios';

const ACCESS_KEY = 'navodaya-admin-token';
const REFRESH_KEY = 'navodaya-admin-refresh-token';

export const api = axios.create({
    baseURL: '/navodaya-clap/admin',
});

export const authApi = axios.create({
    baseURL: '/navodaya-clap/auth',
});

export const localApi = axios.create({
    baseURL: '/api',
});

export function getAccessToken() {
    return sessionStorage.getItem(ACCESS_KEY);
}

export function saveSession(accessToken: string, refreshToken: string) {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
}

type TokenPair = { userId: string; accessToken: string; refreshToken: string };

let refreshing: Promise<string> | null = null;

// Refresh tokens are one-time use, so concurrent 401s must share a single refresh.
function refreshAccessToken() {
    refreshing ??= (async () => {
        const refreshToken = sessionStorage.getItem(REFRESH_KEY);
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await authApi.post<TokenPair>('/refresh-token', { refreshToken });
        saveSession(data.accessToken, data.refreshToken);
        return data.accessToken;
    })().finally(() => { refreshing = null; });
    return refreshing;
}

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error)) return Promise.reject(error);
        const status = error.response?.status;
        const config = error.config as RetryConfig | undefined;
        if (status === 401 && config && !config._retried) {
            config._retried = true;
            try {
                const token = await refreshAccessToken();
                config.headers.Authorization = `Bearer ${token}`;
                return await api.request(config);
            } catch {
                clearSession();
                window.dispatchEvent(new Event('admin:session-expired'));
                return Promise.reject(error);
            }
        }
        if (status === 401) {
            clearSession();
            window.dispatchEvent(new Event('admin:session-expired'));
        } else if (status === 403) {
            window.dispatchEvent(new Event('admin:access-denied'));
        }
        return Promise.reject(error);
    },
);

export function getErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError<{ error?: string; message?: string }>(error)) {
        return error.response?.data?.error ?? error.response?.data?.message ?? fallback;
    }
    return fallback;
}

export type AdminStats = {
    totalUsers: number;
    totalActiveUsers: number;
    totalUsersWithProfiles: number;
    totalBusinesses: number;
    totalPosts: number;
    postsByType: Record<'REGULAR' | 'JOB' | 'BLOOD', number>;
    totalConversationGroups: number;
    totalStateGroups: number;
    totalDistrictGroups: number;
    totalSchoolGroups: number;
    totalSchoolBatchGroups: number;
    totalWorkStateGroups: number;
    totalWorkDistrictGroups: number;
};

export type ContentType = 'POST' | 'PROFILE' | 'MESSAGE' | 'BUSINESS';
export type ReportStatus = 'PENDING' | 'ACKNOWLEDGED' | 'DELETED';

export type ReportContent = {
    id: string;
    [key: string]: unknown;
} | null;

export type Report = {
    id: string;
    contentType: ContentType;
    contentId: string;
    reason: string;
    details: string | null;
    reporterProfileId: string | null;
    reportedAt: string;
    status: ReportStatus;
    resolvedAt: string | null;
    resolvedByUserId: string | null;
    content: ReportContent;
};

export type ReportsResponse = {
    data: Report[];
    total: number;
    page: number;
    limit: number;
};
