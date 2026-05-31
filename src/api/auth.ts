import { apiClient } from './client'
import type {
  AuthAccessTokenResponse,
  AuthLoginRequest,
  AuthRefreshRequest,
  AuthRegisterRequest,
  AuthTokenPairResponse,
  AuthUpdateUserRequest,
  AuthUsersListResponse,
  AuthUser,
  ManagedAuthUser,
} from '../types'

export async function loginWithPassword(
  payload: AuthLoginRequest
): Promise<{ data: AuthTokenPairResponse }> {
  const { data } = await apiClient.post('/api/v1/auth/login', payload)
  return data
}

export async function refreshAccessToken(
  payload: AuthRefreshRequest
): Promise<{ data: AuthAccessTokenResponse }> {
  const { data } = await apiClient.post('/api/v1/auth/refresh', payload)
  return data
}

export async function getCurrentUser(): Promise<{ data: AuthUser }> {
  const { data } = await apiClient.get('/api/v1/auth/me')
  return data
}

export async function registerUserByAdmin(
  payload: AuthRegisterRequest
): Promise<{ data: AuthTokenPairResponse }> {
  const { data } = await apiClient.post('/api/v1/auth/register', payload)
  return data
}

export async function listUsersByAdmin(): Promise<AuthUsersListResponse> {
  const { data } = await apiClient.get('/api/v1/auth/users')
  return data
}

export async function updateUserById(
  userId: number,
  payload: AuthUpdateUserRequest
): Promise<{ data: ManagedAuthUser }> {
  const { data } = await apiClient.patch(`/api/v1/auth/users/${userId}`, payload)
  return data
}
