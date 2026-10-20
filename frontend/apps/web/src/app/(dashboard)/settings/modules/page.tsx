"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useModules } from "@/lib/moduleContext";
import { useDevice } from "@/lib/useDevice";
import type { ModuleKey } from "@pz/shared";

interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "info" | "warning";
}

export default function ModulesManagerPage() {
  const {
    modulesConfig,
    isLoading,
    toggleModule,
    toggleFeature,
    updateAll,
    resetToDefaults,
  } = useModules();

  const device = useDevice();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [filterModule, setFilterModule] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const showToast = (text: string, type: "success" | "info" | "warning" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Module summary metrics
  const metrics = useMemo(() => {
    const moduleKeys = Object.keys(modulesConfig) as ModuleKey[];
    const totalModules = moduleKeys.length;
    const activeModules = moduleKeys.filter((k) => modulesConfig[k].enabled).length;

    let totalFeatures = 0;
    let activeFeatures = 0;

    moduleKeys.forEach((k) => {
      const featValues = Object.values(modulesConfig[k].features);
      totalFeatures += featValues.length;
      activeFeatures += featValues.filter((f) => f.enabled && modulesConfig[k].enabled).length;
    });

    return { totalModules, activeModules, totalFeatures, activeFeatures };
  }, [modulesConfig]);

  const moduleOrder: {
    key: ModuleKey;
    tagline: string;
    accentColor: string;
    gradient: string;
  }[] = [
    {
      key: "transaction",
      tagline: "Commercial Operations & Cash Flow",
      accentColor: "var(--accent-amber)",
      gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.05))",
    },
    {
      key: "profiles",
      tagline: "Master Identity & Associate CRM",
      accentColor: "var(--accent-cyan)",
      gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.05))",
    },
    {
      key: "user",
      tagline: "Access Control & Granular RBAC",
      accentColor: "var(--primary)",
      gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.05))",
    },
    {
      key: "product",
      tagline: "Inventory Ledger, Formulas & Fleet",
      accentColor: "var(--accent-emerald)",
      gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(20, 184, 166, 0.05))",
    },
    {
      key: "facility",
      tagline: "Outlets, Warehouses & Station Routing (KDS)",
      accentColor: "var(--accent-rose)",
      gradient: "linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(236, 72, 153, 0.05))",
    },
  ];

  const handleToggleModule = async (key: ModuleKey, currentState: boolean) => {
    const nextState = !currentState;
    await toggleModule(key, nextState);
    showToast(
      `${modulesConfig[key].name} module ${nextState ? "installed & activated" : "deactivated"}`,
      nextState ? "success" : "warning"
    );
  };

  const handleToggleFeature = async (
    modKey: ModuleKey,
    featKey: string,
    currentState: boolean
  ) => {
    const nextState = !currentState;
    await toggleFeature(modKey, featKey, nextState);
    const featName = modulesConfig[modKey].features[featKey]?.name || featKey;
    showToast(
      `${featName} feature ${nextState ? "enabled" : "disabled"}`,
      nextState ? "success" : "info"
    );
  };

  const handleEnableAll = async () => {
    const updated: typeof modulesConfig = JSON.parse(JSON.stringify(modulesConfig));
    (Object.keys(updated) as ModuleKey[]).forEach((mKey) => {
      const mod = updated[mKey];
      if (mod) {
        mod.enabled = true;
        Object.keys(mod.features).forEach((fKey) => {
          if (mod.features[fKey]) {
            mod.features[fKey].enabled = true;
          }
        });
      }
    });
    await updateAll(updated);
    showToast("⚡ All platform modules & features have been enabled!", "success");
  };

  const handleResetDefaults = async () => {
    if (confirm("Reset all module and feature toggles to system defaults?")) {
      await resetToDefaults();
      showToast("🔄 Module preferences reset to factory defaults", "info");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Toast Notification Container */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slide-in"
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: `1px solid ${
                t.type === "success"
                  ? "var(--accent-emerald)"
                  : t.type === "warning"
                  ? "var(--accent-amber)"
                  : "var(--primary)"
              }`,
              color: "var(--text-primary)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              pointerEvents: "auto",
            }}
          >
            <span>{t.type === "success" ? "✓" : t.type === "warning" ? "⚠️" : "ℹ️"}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Header Banner */}
      <div
        style={{
          padding: device.isSmallScreen ? "1.5rem 1rem" : "2rem 1.75rem",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))",
          border: "1px solid var(--border-subtle)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <Badge variant="info">🧩 System Architecture</Badge>
            <Badge variant="success">Modular Runtime</Badge>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: device.isSmallScreen ? "flex-start" : "center",
              flexDirection: device.isSmallScreen ? "column" : "row",
              gap: "1rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: device.isSmallScreen ? "1.5rem" : "2rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                Module & Feature Manager
              </h1>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  marginTop: "0.35rem",
                  maxWidth: "760px",
                  lineHeight: 1.5,
                }}
              >
                Customize your platform installation by turning standalone modules on and off.
                Deactivating a feature instantly streamlines navigation, reduces system complexity, and secures unauthorized endpoints.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEnableAll}
                id="btn-enable-all-modules"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <span>⚡</span>
                <span>Enable All</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetDefaults}
                id="btn-reset-module-defaults"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <span>🔄</span>
                <span>Reset Defaults</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
          gap: "1rem",
        }}
      >
        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Primary Modules
            </span>
            <span style={{ fontSize: "1.2rem" }}>📦</span>
          </div>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.4rem", color: "var(--text-primary)" }}>
            {metrics.activeModules} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>/ {metrics.totalModules} Active</span>
          </p>
          <span style={{ fontSize: "0.75rem", color: metrics.activeModules === metrics.totalModules ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
            ● {metrics.totalModules - metrics.activeModules} disabled
          </span>
        </Card>

        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Standalone Features
            </span>
            <span style={{ fontSize: "1.2rem" }}>⚡</span>
          </div>
          <p style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.4rem", color: "var(--text-primary)" }}>
            {metrics.activeFeatures} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>/ {metrics.totalFeatures} Active</span>
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>
            Granular controls enabled
          </span>
        </Card>

        <Card style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Persistence State
            </span>
            <span style={{ fontSize: "1.2rem" }}>💾</span>
          </div>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.4rem", color: "var(--accent-emerald)" }}>
            Server Synced
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Auto-persists to config/modules.json
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Modules" },
            { id: "transaction", label: "💳 Transaction" },
            { id: "profiles", label: "🪪 Profiles" },
            { id: "user", label: "🛡️ User" },
            { id: "product", label: "📦 Product" },
            { id: "facility", label: "🏬 Facility" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterModule(tab.id)}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                border: filterModule === tab.id ? "1px solid var(--border-glow)" : "1px solid var(--border-subtle)",
                backgroundColor: filterModule === tab.id ? "var(--bg-surface-elevated)" : "transparent",
                color: filterModule === tab.id ? "var(--primary)" : "var(--text-secondary)",
                transition: "all var(--transition-fast)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search features (e.g. POS, Payroll, Recipes)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "0.45rem 0.85rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            minWidth: "260px",
          }}
        />
      </div>

      {/* 4 Main Module Blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {moduleOrder
          .filter((m) => filterModule === "all" || filterModule === m.key)
          .map(({ key, tagline, accentColor, gradient }) => {
            const mod = modulesConfig[key];
            if (!mod) return null;

            const featuresList = Object.values(mod.features).filter((f) => {
              if (!searchTerm) return true;
              return (
                f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.id.toLowerCase().includes(searchTerm.toLowerCase())
              );
            });

            if (searchTerm && featuresList.length === 0) return null;

            return (
              <div
                key={key}
                id={`module-section-${key}`}
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: `1px solid ${mod.enabled ? "var(--border-subtle)" : "rgba(255, 255, 255, 0.05)"}`,
                  backgroundColor: "var(--bg-surface)",
                  overflow: "hidden",
                  transition: "all var(--transition-normal)",
                  opacity: mod.enabled ? 1 : 0.65,
                }}
              >
                {/* Module Master Header Bar */}
                <div
                  style={{
                    padding: device.isSmallScreen ? "1.25rem 1rem" : "1.5rem 1.75rem",
                    background: gradient,
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.6rem",
                        flexShrink: 0,
                      }}
                    >
                      {mod.icon}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {mod.name} Module
                        </h2>
                        <Badge variant={mod.enabled ? "success" : "default"}>
                          {mod.enabled ? "● Installed & Active" : "○ Inactive"}
                        </Badge>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                        {tagline} — {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Master Toggle Switch */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      {mod.enabled ? "Module Enabled" : "Module Disabled"}
                    </span>
                    <button
                      id={`toggle-master-${key}`}
                      onClick={() => handleToggleModule(key, mod.enabled)}
                      role="switch"
                      aria-checked={mod.enabled}
                      title={`Toggle entire ${mod.name} module`}
                      style={{
                        width: "52px",
                        height: "28px",
                        borderRadius: "9999px",
                        backgroundColor: mod.enabled ? "var(--accent-emerald)" : "rgba(255, 255, 255, 0.15)",
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        transition: "background-color 0.25s ease",
                        padding: "2px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                          transform: mod.enabled ? "translateX(24px)" : "translateX(0px)",
                          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Sub-features Grid */}
                <div
                  style={{
                    padding: device.isSmallScreen ? "1rem" : "1.5rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
                    gap: "1rem",
                  }}
                >
                  {featuresList.map((feat) => {
                    const isFeatureActive = mod.enabled && feat.enabled;

                    return (
                      <div
                        key={feat.id}
                        id={`feature-card-${key}-${feat.id}`}
                        style={{
                          padding: "1.25rem",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: isFeatureActive ? "var(--bg-surface-elevated)" : "rgba(255, 255, 255, 0.02)",
                          border: `1px solid ${isFeatureActive ? "var(--border-subtle)" : "rgba(255, 255, 255, 0.05)"}`,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "all var(--transition-fast)",
                          opacity: isFeatureActive ? 1 : 0.6,
                        }}
                      >
                        <div>
                          {/* Feature Header: Icon, Name, and Toggle */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <span style={{ fontSize: "1.35rem" }}>{feat.icon}</span>
                              <div>
                                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                  {feat.name}
                                </h4>
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                  ID: <code>{feat.id}</code>
                                </span>
                              </div>
                            </div>

                            {/* Sub-feature Toggle Switch */}
                            <button
                              id={`toggle-${key}-${feat.id}`}
                              disabled={!mod.enabled}
                              onClick={() => handleToggleFeature(key, feat.id, feat.enabled)}
                              role="switch"
                              aria-checked={feat.enabled}
                              title={`Toggle ${feat.name}`}
                              style={{
                                width: "42px",
                                height: "24px",
                                borderRadius: "9999px",
                                backgroundColor: isFeatureActive ? "var(--primary)" : "rgba(255, 255, 255, 0.15)",
                                border: "none",
                                cursor: mod.enabled ? "pointer" : "not-allowed",
                                position: "relative",
                                transition: "background-color 0.25s ease",
                                padding: "2px",
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  backgroundColor: "#ffffff",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                  transform: feat.enabled ? "translateX(18px)" : "translateX(0px)",
                                  transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                              />
                            </button>
                          </div>

                          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.45, marginBottom: "0.85rem" }}>
                            {feat.description}
                          </p>
                        </div>

                        {/* Bottom Row: Status Pill & Quick Launch Link */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingTop: "0.65rem",
                            borderTop: "1px solid var(--border-subtle)",
                            marginTop: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: isFeatureActive ? "var(--accent-emerald)" : "var(--text-muted)",
                            }}
                          >
                            {isFeatureActive ? "🟢 Active in Navigation" : "⚪ Disabled / Hidden"}
                          </span>

                          {isFeatureActive && feat.routePaths.length > 0 && feat.routePaths[0] && (
                            <Link
                              href={feat.routePaths[0]}
                              id={`launch-${key}-${feat.id}`}
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--primary)",
                                textDecoration: "none",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                              }}
                            >
                              <span>Open</span>
                              <span>→</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
