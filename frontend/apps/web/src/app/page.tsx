"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatIDR } from "@pz/shared";
import { useAuth } from "@/lib/authContext";

interface FeaturedItem {
  id: string;
  name: string;
  category: "coffee" | "bakery" | "savory" | "drinks";
  categoryLabel: string;
  price: number;
  description: string;
  tags: string[];
  imageUrl: string;
}

const FEATURED_ITEMS: FeaturedItem[] = [
  {
    id: "f-1",
    name: "Iced Sea Salt Caramel Latte",
    category: "coffee",
    categoryLabel: "Signature Coffee",
    price: 42000,
    description: "Double espresso shot layered with housemade caramel, creamy oat milk, and a delicate whipped sea salt cream foam.",
    tags: ["Best Seller", "Signature"],
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "f-2",
    name: "Almond Frangipane Croissant",
    category: "bakery",
    categoryLabel: "French Viennoiserie",
    price: 34000,
    description: "Twice-baked French butter croissant filled with velvety almond frangipane cream, topped with toasted sliced almonds.",
    tags: ["Baked Fresh Daily", "Popular"],
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "f-3",
    name: "Cold Brew Elixir",
    category: "coffee",
    categoryLabel: "Specialty Coffee",
    price: 38000,
    description: "18-hour cold steeped single-origin coffee with distinct dark cherry, chocolate nibs, and honey aftertaste. Crisp and refreshing.",
    tags: ["House Favorite", "Slow Brew"],
    imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "f-4",
    name: "Truffle Mushroom Pasta",
    category: "savory",
    categoryLabel: "Artisan Eatery",
    price: 68000,
    description: "Al dente spaghetti tossed in rich white truffle butter, sautéed portobello and champignon mushrooms, with aged parmesan cheese.",
    tags: ["Chef's Choice"],
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "f-5",
    name: "Ceremonial Uji Matcha Latte",
    category: "drinks",
    categoryLabel: "Artisan Beverages",
    price: 45000,
    description: "Grade-A ceremonial matcha whisked with fresh steamed milk, delivering vibrant umami and smooth sweetness.",
    tags: ["Imported Kyoto"],
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "f-6",
    name: "Artisan Brioche Wagyu Burger",
    category: "savory",
    categoryLabel: "Artisan Eatery",
    price: 78000,
    description: "Juicy Australian Wagyu beef patty, melted aged cheddar, caramelized shallots, house truffle aioli in a toasted brioche bun.",
    tags: ["Hearty Delight"],
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
  },
];

export default function CafeCustomerHomePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return FEATURED_ITEMS;
    return FEATURED_ITEMS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary, #0a0d14)",
        color: "var(--text-primary, #f3f4f6)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        overflowX: "hidden",
      }}
    >
      {/* ── Top Glass Navigation Bar ────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(10, 13, 20, 0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "all var(--transition-normal)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0.65rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo & Brand */}
          <Link
            href="/"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.2rem",
              textDecoration: "none",
            }}
          >
            <img
              src="/logo.png"
              alt="Chrono Cafe & Eatery"
              style={{
                height: "36px",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 8px rgba(212, 175, 55, 0.35))",
              }}
            />
            <span
              style={{
                fontSize: "0.6rem",
                color: "var(--text-muted, #9ca3af)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Cafe &amp; Eatery
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
            }}
            className="desktop-only"
          >
            <a
              href="#specialties"
              style={{
                color: "var(--text-secondary, #9ca3af)",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary, #9ca3af)")}
            >
              ☕ Featured Menu
            </a>
            <a
              href="#dine-in"
              style={{
                color: "var(--text-secondary, #9ca3af)",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary, #9ca3af)")}
            >
              🪑 Dine-In Experience
            </a>
            <a
              href="#about"
              style={{
                color: "var(--text-secondary, #9ca3af)",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary, #9ca3af)")}
            >
              🌿 Our Story
            </a>
            <a
              href="#location"
              style={{
                color: "var(--text-secondary, #9ca3af)",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary, #9ca3af)")}
            >
              📍 Location &amp; Hours
            </a>
          </nav>

          {/* Action Area: Visit CTA & Staff portal link */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a
              href="#location"
              style={{
                padding: "0.45rem 0.75rem",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                borderRadius: "var(--radius-md, 8px)",
                fontWeight: 600,
                fontSize: "0.8rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "all var(--transition-fast)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
            >
              <span>📍</span>
              <span>Find Us</span>
            </a>

            {user ? (
              <Link
                href="/dashboard"
                style={{
                  padding: "0.45rem 0.7rem",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid var(--primary, #6366f1)",
                  color: "#ffffff",
                  borderRadius: "var(--radius-md, 8px)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  whiteSpace: "nowrap",
                }}
              >
                <span>🛡️</span>
                <span>Staff Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                style={{
                  padding: "0.45rem 0.65rem",
                  color: "var(--text-muted, #9ca3af)",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Staff Login
              </Link>
            )}

            {/* Mobile menu hamburger toggle (desktop nav links only, not needed when both CTAs are visible) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                fontSize: "1.4rem",
                cursor: "pointer",
                padding: "0.25rem",
                display: "none",
              }}
              className="mobile-only"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: "1rem 1.5rem 1.5rem",
              backgroundColor: "rgba(10, 13, 20, 0.98)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <a
              href="#specialties"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: "#ffffff", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}
            >
              ☕ Featured Menu
            </a>
            <a
              href="#dine-in"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: "#ffffff", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}
            >
              🪑 Dine-In Experience
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: "#ffffff", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}
            >
              🌿 Our Story
            </a>
            <a
              href="#location"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: "#ffffff", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}
            >
              📍 Location &amp; Hours
            </a>
          </div>
        )}
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 1.5rem",
          overflow: "hidden",
          background: "radial-gradient(ellipse at 50% 20%, #1c233a 0%, #0a0d14 75%)",
        }}
      >
        {/* Subtle Decorative Ambient Glows */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "860px", position: "relative", zIndex: 10 }}>
          {/* Status Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 0.95rem",
              borderRadius: "999px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "var(--accent-emerald, #10b981)",
              fontSize: "0.8rem",
              fontWeight: 700,
              marginBottom: "1.75rem",
              letterSpacing: "0.02em",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.15)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-emerald, #10b981)",
                boxShadow: "0 0 8px #10b981",
              }}
            />
            <span>Open Today: 07:00 AM – 10:00 PM • Senopati, Jakarta</span>
          </div>

          {/* Hero Main Heading */}
          <h1
            style={{
              fontSize: "clamp(2.3rem, 6vw, 4.2rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
              marginBottom: "1.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Crafted with Passion. <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #d4af37 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Served to Perfection.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.22rem)",
              color: "var(--text-secondary, #9ca3af)",
              lineHeight: 1.65,
              marginBottom: "2.5rem",
              maxWidth: "700px",
              marginInline: "auto",
            }}
          >
            Welcome to <strong>Chrono Cafe &amp; Eatery</strong>. Savor specialty coffee,
            warm artisanal viennoiserie, and hearty gourmet dishes in our welcoming, relaxed space.
          </p>

          {/* Hero Action Buttons (Explore Menu & Visit Us - No digital menu link) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <a
              id="hero-explore-menu-btn"
              href="#specialties"
              style={{
                padding: "0.95rem 2rem",
                backgroundColor: "var(--primary, #6366f1)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "1rem",
                borderRadius: "var(--radius-md, 8px)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 6px 20px rgba(99, 102, 241, 0.45)",
                transition: "all var(--transition-fast)",
              }}
            >
              <span>📖 Explore Our Menu</span>
              <span>↓</span>
            </a>

            <a
              href="#location"
              style={{
                padding: "0.95rem 1.75rem",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1rem",
                borderRadius: "var(--radius-md, 8px)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                backdropFilter: "blur(8px)",
                transition: "all var(--transition-fast)",
              }}
            >
              <span>📍 Visit Us in Senopati</span>
            </a>
          </div>

          {/* Key Atmosphere Highlights */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginTop: "4rem",
              textAlign: "left",
            }}
          >
            <div
              style={{
                padding: "1.1rem",
                borderRadius: "var(--radius-md, 8px)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>☕</div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#ffffff" }}>Specialty Coffee</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #9ca3af)", marginTop: "0.2rem" }}>
                Precision espresso, creamy lattes, and artisan cold brews.
              </div>
            </div>

            <div
              style={{
                padding: "1.1rem",
                borderRadius: "var(--radius-md, 8px)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>🥐</div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#ffffff" }}>Daily Fresh Pastries</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #9ca3af)", marginTop: "0.2rem" }}>
                100% French butter viennoiserie baked hot every morning.
              </div>
            </div>

            <div
              style={{
                padding: "1.1rem",
                borderRadius: "var(--radius-md, 8px)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>🍝</div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#ffffff" }}>Artisan Eatery</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #9ca3af)", marginTop: "0.2rem" }}>
                Hearty pastas, gourmet burgers, and farm-fresh brunch.
              </div>
            </div>

            <div
              style={{
                padding: "1.1rem",
                borderRadius: "var(--radius-md, 8px)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>🌿</div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#ffffff" }}>Lounge &amp; Workspace</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #9ca3af)", marginTop: "0.2rem" }}>
                Fiber Wi-Fi, power outlets, and breezy pet-friendly patio.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Specialties Showcase ──────────────────────────────────── */}
      <section
        id="specialties"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "5rem 1.5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              textTransform: "uppercase",
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "var(--primary, #6366f1)",
              letterSpacing: "0.15em",
            }}
          >
            CHRONO CAFE &amp; EATERY
          </span>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 900,
              color: "#ffffff",
              marginTop: "0.35rem",
              marginBottom: "0.75rem",
            }}
          >
            Signature Favorites &amp; Delights
          </h2>
          <p
            style={{
              color: "var(--text-secondary, #9ca3af)",
              fontSize: "0.95rem",
              maxWidth: "580px",
              marginInline: "auto",
            }}
          >
            Carefully curated ingredients prepared fresh by our baristas and chefs every day.
          </p>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "1.75rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { id: "all", label: "🌟 All Delights" },
              { id: "coffee", label: "☕ Specialty Coffee" },
              { id: "bakery", label: "🥐 Artisanal Bakery" },
              { id: "savory", label: "🍝 Artisan Eatery" },
              { id: "drinks", label: "🍵 Beverages" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: "0.55rem 1.15rem",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  backgroundColor:
                    activeCategory === cat.id ? "var(--primary, #6366f1)" : "rgba(255, 255, 255, 0.05)",
                  color: activeCategory === cat.id ? "#ffffff" : "var(--text-secondary, #9ca3af)",
                  border:
                    activeCategory === cat.id
                      ? "1px solid var(--primary, #6366f1)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: activeCategory === cat.id ? "0 4px 12px rgba(99, 102, 241, 0.35)" : "none",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.75rem",
          }}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                borderRadius: "var(--radius-lg, 12px)",
                backgroundColor: "var(--bg-surface, #111522)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 16px 32px rgba(0, 0, 0, 0.5)";
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              {/* Product Photo */}
              <div style={{ position: "relative", width: "100%", height: "210px", overflow: "hidden" }}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.4s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
                {/* Category & Tags Badges */}
                <div
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    left: "0.75rem",
                    display: "flex",
                    gap: "0.4rem",
                    flexWrap: "wrap",
                  }}
                >
                  {item.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "0.25rem 0.6rem",
                        backgroundColor: "rgba(10, 13, 20, 0.75)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#ffffff",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        borderRadius: "4px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div
                style={{
                  padding: "1.4rem",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--primary, #6366f1)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.3rem",
                    }}
                  >
                    {item.categoryLabel}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      color: "#ffffff",
                      marginBottom: "0.5rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--text-secondary, #9ca3af)",
                      lineHeight: 1.5,
                      marginBottom: "1.25rem",
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Price Display */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "1rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #9ca3af)", display: "block" }}>
                      Price
                    </span>
                    <span style={{ fontSize: "1.18rem", fontWeight: 800, color: "var(--accent-emerald, #10b981)" }}>
                      {formatIDR(item.price)}
                    </span>
                  </div>

                  <span
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "999px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--text-muted, #9ca3af)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Fresh Daily
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cafe Information Banner */}
        <div
          style={{
            marginTop: "3.5rem",
            padding: "2rem",
            borderRadius: "var(--radius-lg, 12px)",
            backgroundColor: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.25rem",
          }}
        >
          <div>
            <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.35rem" }}>
              Looking for something special? Ask our team for daily specials
            </h4>
            <p style={{ color: "var(--text-secondary, #9ca3af)", fontSize: "0.88rem", margin: 0 }}>
              We regularly rotate seasonal single-origins, seasonal fruit pastries, and chef specials.
            </p>
          </div>

          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "0.85rem 1.6rem",
              backgroundColor: "var(--primary, #6366f1)",
              color: "#ffffff",
              borderRadius: "var(--radius-md, 8px)",
              fontWeight: 700,
              fontSize: "0.92rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
            }}
          >
            💬 Contact Cafe on WhatsApp
          </a>
        </div>
      </section>

      {/* ── The Dine-In Experience: 3 Simple Steps ─────────────────────────── */}
      <section
        id="dine-in"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          padding: "5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
          <span
            style={{
              textTransform: "uppercase",
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "var(--accent-emerald, #10b981)",
              letterSpacing: "0.15em",
            }}
          >
            The Chrono Experience
          </span>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: 900,
              color: "#ffffff",
              marginTop: "0.35rem",
              marginBottom: "0.75rem",
            }}
          >
            Relaxed Dining &amp; Effortless Hospitality
          </h2>
          <p
            style={{
              color: "var(--text-secondary, #9ca3af)",
              fontSize: "0.95rem",
              maxWidth: "600px",
              marginInline: "auto",
              marginBottom: "3.5rem",
            }}
          >
            No waiting in long queues or waving down staff. Take a seat and enjoy our hospitality in 3 easy steps.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2rem",
              textAlign: "left",
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                padding: "2rem",
                borderRadius: "var(--radius-lg, 12px)",
                backgroundColor: "var(--bg-surface, #111522)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "2.4rem",
                  marginBottom: "1rem",
                }}
              >
                🪑
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  fontWeight: 900,
                  fontSize: "1.8rem",
                  color: "rgba(255, 255, 255, 0.1)",
                }}
              >
                01
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
                Take Your Seat
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-secondary, #9ca3af)", lineHeight: 1.6 }}>
                Pick any indoor booth or breezy outdoor garden table. Find the secure QR code on your tabletop.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                padding: "2rem",
                borderRadius: "var(--radius-lg, 12px)",
                backgroundColor: "var(--bg-surface, #111522)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "2.4rem",
                  marginBottom: "1rem",
                }}
              >
                📱
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  fontWeight: 900,
                  fontSize: "1.8rem",
                  color: "rgba(255, 255, 255, 0.1)",
                }}
              >
                02
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
                Scan Table QR
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-secondary, #9ca3af)", lineHeight: 1.6 }}>
                Scan the QR code with your phone camera. View the live table menu and customize sweetness or notes easily.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                padding: "2rem",
                borderRadius: "var(--radius-lg, 12px)",
                backgroundColor: "var(--bg-surface, #111522)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "2.4rem",
                  marginBottom: "1rem",
                }}
              >
                ⚡
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "1.5rem",
                  right: "1.5rem",
                  fontWeight: 900,
                  fontSize: "1.8rem",
                  color: "rgba(255, 255, 255, 0.1)",
                }}
              >
                03
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
                Served Fresh to Table
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-secondary, #9ca3af)", lineHeight: 1.6 }}>
                Pay seamlessly at your table via QRIS or card. Our team prepares everything and delivers hot dishes directly to your seat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Story & Philosophy ─────────────────────────────────────────── */}
      <section
        id="about"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "5rem 1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "3.5rem",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80"
            alt="Barista brewing coffee at Chrono"
            style={{
              width: "100%",
              height: "440px",
              objectFit: "cover",
              borderRadius: "var(--radius-lg, 12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-1.5rem",
              right: "-1rem",
              padding: "1.25rem 1.5rem",
              borderRadius: "var(--radius-md, 8px)",
              backgroundColor: "rgba(10, 13, 20, 0.95)",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.7)",
              maxWidth: "240px",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#d4af37" }}>Crafted Daily</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary, #9ca3af)", marginTop: "0.2rem" }}>
              Honest ingredients, warm hospitality, and specialty drinks.
            </div>
          </div>
        </div>

        <div>
          <span
            style={{
              textTransform: "uppercase",
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "var(--primary, #6366f1)",
              letterSpacing: "0.15em",
            }}
          >
            The Chrono Story
          </span>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: 900,
              color: "#ffffff",
              marginTop: "0.35rem",
              marginBottom: "1.25rem",
              lineHeight: 1.2,
            }}
          >
            Dedicated to the Craft of Fine Coffee &amp; Good Food
          </h2>
          <p
            style={{
              color: "var(--text-secondary, #9ca3af)",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              marginBottom: "1rem",
            }}
          >
            Chrono was founded with a singular passion: creating an authentic neighborhood cafe and eatery where
            exceptional coffee meets honest, delicious dining. From morning viennoiserie baked with French butter
            to savory pastas, gourmet burgers, and artisan drinks, Chrono is your sanctuary in the heart of Senopati.
          </p>
          <p
            style={{
              color: "var(--text-secondary, #9ca3af)",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            Whether you are catching up with friends on our garden terrace, hosting a morning business briefing, or
            sinking into deep work with high-speed fiber Wi-Fi, Chrono is built to be your comfortable home away from home.
          </p>

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ffffff" }}>20+</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #9ca3af)" }}>Handcrafted Drinks &amp; Dishes</div>
            </div>
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ffffff" }}>100%</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #9ca3af)" }}>Arabica Specialty Coffee</div>
            </div>
            <div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ffffff" }}>4.9 ★</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #9ca3af)" }}>Community Diner Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Location, Hours & Contact ──────────────────────────────────────── */}
      <section
        id="location"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          padding: "5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span
              style={{
                textTransform: "uppercase",
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "var(--accent-emerald, #10b981)",
                letterSpacing: "0.15em",
              }}
            >
              Visit Our Cafe
            </span>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                fontWeight: 900,
                color: "#ffffff",
                marginTop: "0.35rem",
                marginBottom: "0.75rem",
              }}
            >
              Location &amp; Operating Hours
            </h2>
            <p style={{ color: "var(--text-secondary, #9ca3af)", fontSize: "0.95rem" }}>
              Located right in the heart of Senopati culinary district. Easy access, spacious seating, and valet parking.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "2rem",
            }}
          >
            {/* Address Card */}
            <div
              style={{
                padding: "2rem",
                borderRadius: "var(--radius-lg, 12px)",
                backgroundColor: "var(--bg-surface, #111522)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "0.85rem" }}>📍</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
                Chrono Cafe &amp; Eatery
              </h3>
              <p style={{ color: "var(--text-secondary, #9ca3af)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Jl. Senopati No. 45, RT.6/RW.2, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12190
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted, #9ca3af)" }}>WhatsApp Direct:</span>
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#25D366", fontWeight: 700, textDecoration: "none" }}
                  >
                    +62 812-3456-7890
                  </a>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted, #9ca3af)" }}>Email Inquiries:</span>
                  <a
                    href="mailto:hello@chrono.cafe"
                    style={{ color: "var(--primary, #6366f1)", fontWeight: 700, textDecoration: "none" }}
                  >
                    hello@chrono.cafe
                  </a>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted, #9ca3af)" }}>Parking:</span>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>Complimentary Valet Service</span>
                </div>
              </div>

              <div style={{ marginTop: "1.75rem" }}>
                <a
                  href="https://maps.google.com/?q=Senopati+Jakarta"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    borderRadius: "var(--radius-md, 8px)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  🗺️ Open in Google Maps
                </a>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div
              style={{
                padding: "2rem",
                borderRadius: "var(--radius-lg, 12px)",
                backgroundColor: "var(--bg-surface, #111522)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "0.85rem" }}>🕒</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
                Opening Hours
              </h3>
              <p style={{ color: "var(--text-secondary, #9ca3af)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                Open 7 days a week, welcoming early birds and evening dining.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>Monday – Thursday</span>
                  <span style={{ color: "var(--accent-emerald, #10b981)", fontWeight: 700 }}>07:00 – 22:00</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>Friday – Saturday</span>
                  <span style={{ color: "var(--accent-emerald, #10b981)", fontWeight: 700 }}>07:00 – 23:00</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>Sunday &amp; Public Holidays</span>
                  <span style={{ color: "var(--accent-emerald, #10b981)", fontWeight: 700 }}>07:00 – 22:00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted, #9ca3af)" }}>Kitchen Last Order:</span>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>45 mins before closing</span>
                </div>
              </div>

              <div style={{ marginTop: "1.75rem" }}>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "var(--accent-emerald, #10b981)",
                    color: "#ffffff",
                    borderRadius: "var(--radius-md, 8px)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                  }}
                >
                  💬 Reserve or Inquire on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "3.5rem 1.5rem 2rem",
          backgroundColor: "#07090e",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Logo & Copyright */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/logo.png"
              alt="Chrono Logo"
              style={{
                height: "32px",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 6px rgba(212, 175, 55, 0.3))",
              }}
            />
            <div>
              <div style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.95rem" }}>Chrono Cafe &amp; Eatery</div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted, #9ca3af)" }}>
                © {new Date().getFullYear()} Chrono. All rights reserved.
              </div>
            </div>
          </div>

          {/* Social Links & Staff Portal */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.82rem" }}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-secondary, #9ca3af)", textDecoration: "none" }}
            >
              Instagram
            </a>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-secondary, #9ca3af)", textDecoration: "none" }}
            >
              WhatsApp
            </a>
            <Link
              href="/login"
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-muted, #9ca3af)",
                textDecoration: "none",
                fontSize: "0.75rem",
              }}
            >
              Staff Portal 🔒
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: "1280px", margin: "1.5rem auto 0", textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted, #6b7280)" }}>
          Chrono Cafe &amp; Eatery • Specialty Coffee, French Viennoiserie &amp; All-Day Dining
        </div>
      </footer>

      {/* Global Responsive Styles for Desktop Navigation */}
      <style jsx global>{`
        @media (min-width: 860px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 859px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
