"use client"

import { useState, useEffect, useRef } from "react"

interface SystemSettings {
  free_user_download_limit: string
  gallery_moderation: string
  max_panel_size_free: string
  max_panel_size_pro: string
  max_panel_size_enterprise: string
}

const DEFAULT_SETTINGS: SystemSettings = {
  free_user_download_limit: "5",
  gallery_moderation: "false",
  max_panel_size_free: "1200",
  max_panel_size_pro: "5000",
  max_panel_size_enterprise: "99999",
}

let globalSettingsCache: SystemSettings | null = null
const globalSettingsPromise: Promise<SystemSettings> | null = null

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    // Set global cache to defaults if not already set
    if (!globalSettingsCache) {
      globalSettingsCache = DEFAULT_SETTINGS
      console.log("[v0] Using default system settings (API disabled for v0 preview)")
    }
    setSettings(DEFAULT_SETTINGS)
    setLoading(false)
  }, [])

  const fetchSettings = async () => {
    console.log("[v0] Settings refetch requested - using defaults")
    setSettings(DEFAULT_SETTINGS)
    setLoading(false)
    setError(null)
  }

  const getFreeUserLimit = () => {
    const limit = Number.parseInt(settings.free_user_download_limit) || 5
    return limit
  }

  const getMaxPanelSize = (planType = "free") => {
    let maxSize: number
    switch (planType) {
      case "pro":
      case "monthly":
      case "yearly":
        maxSize = Number.parseInt(settings.max_panel_size_pro) || 5000
        break
      case "enterprise":
        maxSize = Number.parseInt(settings.max_panel_size_enterprise) || 99999
        break
      default:
        maxSize = Number.parseInt(settings.max_panel_size_free) || 1200
        break
    }
    return maxSize
  }

  return {
    settings,
    loading,
    error,
    getFreeUserLimit,
    getMaxPanelSize,
    refetch: fetchSettings,
  }
}
