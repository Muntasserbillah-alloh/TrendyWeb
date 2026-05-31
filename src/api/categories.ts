import { apiClient } from './client'
import type { Category } from '../types'

export async function getCategories(): Promise<{ data: Category[] }> {
  const { data } = await apiClient.get('/api/v1/categories/')
  return data
}

export async function createCategory(body: {
  name: string
  description?: string
}): Promise<{ data: Category }> {
  const { data } = await apiClient.post('/api/v1/categories/', body)
  return data
}

export async function updateCategory(
  id: number,
  body: Partial<{ name: string; description: string }>
): Promise<{ data: Category }> {
  const { data } = await apiClient.put(`/api/v1/categories/${id}`, body)
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/categories/${id}`)
}
