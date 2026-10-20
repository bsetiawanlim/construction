"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  DEFAULT_MODULES_CONFIG,
  type SystemModulesConfig,
  type ModuleKey,
} from "@pz/shared";
import { moduleApi } from "./api";

const STORAGE_KEY = "pz_system_modules_config";

interface ModuleContextType {
  modulesConfig: SystemModulesConfig;
  isLoading: boolean;
  isModuleEnabled: (moduleId: ModuleKey) => boolean;
  isFeatureEnabled: (moduleId: ModuleKey, featureId: string) => boolean;
  isPathAllowed: (pathname: string) => boolean;
  toggleModule: (moduleId: ModuleKey, enabled: boolean) => Promise<void>;
  toggleFeature: (moduleId: ModuleKey, featureId: string, enabled: boolean) => Promise<void>;
  updateAll: (config: SystemModulesConfig) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType>({
  modulesConfig: DEFAULT_MODULES_CONFIG,
  isLoading: true,
  isModuleEnabled: () => true,
  isFeatureEnabled: () => true,
  isPathAllowed: () => true,
  toggleModule: async () => {},
  toggleFeature: async () => {},
  updateAll: async () => {},
  resetToDefaults: async () => {},
});

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [modulesConfig, setModulesConfig] = useState<SystemModulesConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          return { ...DEFAULT_MODULES_CONFIG, ...parsed };
        }
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_MODULES_CONFIG;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Sync with backend API on mount
  const syncWithServer = useCallback(async () => {
    try {
      const res = await moduleApi.getModules();
      if (res && res.success && res.data) {
        setModulesConfig(res.data);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
        }
      }
    } catch (err) {
      console.warn("Failed to sync module configuration with server, using local/default:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  const isModuleEnabled = useCallback(
    (moduleId: ModuleKey): boolean => {
      const mod = modulesConfig[moduleId];
      return mod ? mod.enabled !== false : true;
    },
    [modulesConfig]
  );

  const isFeatureEnabled = useCallback(
    (moduleId: ModuleKey, featureId: string): boolean => {
      const mod = modulesConfig[moduleId];
      if (!mod || mod.enabled === false) return false;
      const feat = mod.features[featureId];
      return feat ? feat.enabled !== false : true;
    },
    [modulesConfig]
  );

  const isPathAllowed = useCallback(
    (pathname: string): boolean => {
      // General paths are always allowed
      if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/report")
      ) {
        return true;
      }

      // Check across all modules and sub-features
      for (const modKey of Object.keys(modulesConfig) as ModuleKey[]) {
        const mod = modulesConfig[modKey];
        if (!mod) continue;
        for (const featKey of Object.keys(mod.features)) {
          const feat = mod.features[featKey];
          if (!feat) continue;
          const matchesRoute = feat.routePaths.some((p) =>
            p === pathname || (p !== "/" && pathname.startsWith(p))
          );
          if (matchesRoute) {
            // Both module and sub-feature must be enabled
            return mod.enabled !== false && feat.enabled !== false;
          }
        }
      }

      return true;
    },
    [modulesConfig]
  );

  const toggleModule = useCallback(
    async (moduleId: ModuleKey, enabled: boolean) => {
      // Optimistic update
      const updated: SystemModulesConfig = {
        ...modulesConfig,
        [moduleId]: {
          ...modulesConfig[moduleId],
          enabled,
          features: Object.fromEntries(
            Object.entries(modulesConfig[moduleId].features).map(([k, v]) => [
              k,
              { ...v, enabled },
            ])
          ),
        },
      };

      setModulesConfig(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      try {
        await moduleApi.toggleModule(moduleId, enabled);
      } catch (err) {
        console.error("Failed to persist module toggle to backend:", err);
      }
    },
    [modulesConfig]
  );

  const toggleFeature = useCallback(
    async (moduleId: ModuleKey, featureId: string, enabled: boolean) => {
      const mod = modulesConfig[moduleId];
      if (!mod || !mod.features[featureId]) return;

      const updatedFeatures = {
        ...mod.features,
        [featureId]: {
          ...mod.features[featureId],
          enabled,
        },
      };

      // Check if at least one feature is enabled to keep module enabled
      const hasAnyFeature = Object.values(updatedFeatures).some((f) => f.enabled);

      const updated: SystemModulesConfig = {
        ...modulesConfig,
        [moduleId]: {
          ...mod,
          enabled: hasAnyFeature,
          features: updatedFeatures,
        },
      };

      setModulesConfig(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      try {
        await moduleApi.toggleFeature(moduleId, featureId, enabled);
      } catch (err) {
        console.error("Failed to persist feature toggle to backend:", err);
      }
    },
    [modulesConfig]
  );

  const updateAll = useCallback(
    async (newConfig: SystemModulesConfig) => {
      setModulesConfig(newConfig);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      }
      try {
        await moduleApi.updateModules(newConfig);
      } catch (err) {
        console.error("Failed to update modules configuration to backend:", err);
      }
    },
    []
  );

  const resetToDefaults = useCallback(async () => {
    setModulesConfig(DEFAULT_MODULES_CONFIG);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MODULES_CONFIG));
    }
    try {
      await moduleApi.resetModules();
    } catch (err) {
      console.error("Failed to reset modules configuration in backend:", err);
    }
  }, []);

  const value = useMemo(
    () => ({
      modulesConfig,
      isLoading,
      isModuleEnabled,
      isFeatureEnabled,
      isPathAllowed,
      toggleModule,
      toggleFeature,
      updateAll,
      resetToDefaults,
    }),
    [
      modulesConfig,
      isLoading,
      isModuleEnabled,
      isFeatureEnabled,
      isPathAllowed,
      toggleModule,
      toggleFeature,
      updateAll,
      resetToDefaults,
    ]
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules() {
  return useContext(ModuleContext);
}
