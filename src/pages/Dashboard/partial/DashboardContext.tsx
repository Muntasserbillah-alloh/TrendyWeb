import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { useRegions } from '../../../hooks/useRegions'

const DASHBOARD_REGION_STORAGE_KEY = 'dashboard_region'

interface DashboardContextValue {
    regionCode: string | undefined
    regionOptions: Array<{ value: string; label: string }>
    isRegionsLoading: boolean
    regionsError: unknown
    onRegionChange: (nextRegion: string) => void
    refetchRegions: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function useDashboardContext(): DashboardContextValue {
    const ctx = useContext(DashboardContext)
    if (!ctx) {
        throw new Error('useDashboardContext must be used within DashboardProvider')
    }
    return ctx
}

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [selectedRegionCode, setSelectedRegionCode] = useState<string | undefined>(() => {
        if (typeof window === 'undefined') return undefined
        const stored = window.localStorage.getItem(DASHBOARD_REGION_STORAGE_KEY)?.trim()
        return stored || undefined
    })

    const {
        data: regionsData,
        isLoading: isRegionsLoading,
        error: regionsError,
        refetch: refetchRegions,
    } = useRegions()

    const regionOptions = useMemo(
        () =>
            (regionsData?.data ?? []).map((region) => ({
                value: region.code,
                label: `${region.name} (${region.code})`,
            })),
        [regionsData?.data]
    )

    const regionCode = useMemo(() => {
        if (selectedRegionCode && regionOptions.some((opt) => opt.value === selectedRegionCode)) {
            return selectedRegionCode
        }
        return regionOptions[0]?.value
    }, [regionOptions, selectedRegionCode])

    useEffect(() => {
        if (!regionCode) return
        if (selectedRegionCode === regionCode) return
        setSelectedRegionCode(regionCode)
    }, [regionCode, selectedRegionCode])

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!selectedRegionCode) return
        window.localStorage.setItem(DASHBOARD_REGION_STORAGE_KEY, selectedRegionCode)
    }, [selectedRegionCode])

    return (
        <DashboardContext.Provider
            value={{
                regionCode,
                regionOptions,
                isRegionsLoading,
                regionsError,
                onRegionChange: setSelectedRegionCode,
                refetchRegions: () => {
                    void refetchRegions()
                },
            }}
        >
            {children}
        </DashboardContext.Provider>
    )
}
