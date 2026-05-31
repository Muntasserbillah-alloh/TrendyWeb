import { apiClient } from './client'
import type { Region } from '../types'

export async function getRegions(): Promise<{ data: Region[] }> {
  const { data } = await apiClient.get('/api/v1/regions/')
  return data
}

export async function createRegion(body: {
  name: string
  code: string
  country_codes: string[]
}): Promise<{ data: Region }> {
  const { data } = await apiClient.post('/api/v1/regions/', body)
  return data
}

export async function updateRegion(
  id: number,
  body: Partial<{ name: string; code: string; country_codes: string[] }>
): Promise<{ data: Region }> {
  const { data } = await apiClient.put(`/api/v1/regions/${id}`, body)
  return data
}

export async function deleteRegion(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/regions/${id}`)
}
