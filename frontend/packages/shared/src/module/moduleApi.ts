import type { ApiClient } from "../api/client";
import type { ApiSuccess } from "../api/types";
import {
  DEFAULT_MODULES_CONFIG,
  type SystemModulesConfig,
  type ModuleKey,
} from "./types";

export function createModuleApi(client: ApiClient) {
  return {
    async getModules(): Promise<ApiSuccess<SystemModulesConfig>> {
      try {
        return await client.get<SystemModulesConfig>("/api/system/modules");
      } catch {
        return {
          success: true,
          statusCode: 200,
          message: "Default module configuration",
          data: DEFAULT_MODULES_CONFIG,
        };
      }
    },

    async updateModules(
      config: SystemModulesConfig
    ): Promise<ApiSuccess<SystemModulesConfig>> {
      return client.post<SystemModulesConfig>(
        "/api/system/modules/update",
        config
      );
    },

    async toggleModule(
      moduleId: ModuleKey,
      enabled: boolean
    ): Promise<ApiSuccess<SystemModulesConfig>> {
      return client.post<SystemModulesConfig>("/api/system/modules/toggle", {
        moduleId,
        enabled,
      });
    },

    async toggleFeature(
      moduleId: ModuleKey,
      featureId: string,
      enabled: boolean
    ): Promise<ApiSuccess<SystemModulesConfig>> {
      return client.post<SystemModulesConfig>("/api/system/modules/toggle", {
        moduleId,
        featureId,
        enabled,
      });
    },

    async resetModules(): Promise<ApiSuccess<SystemModulesConfig>> {
      return client.post<SystemModulesConfig>(
        "/api/system/modules/reset",
        {}
      );
    },
  };
}
