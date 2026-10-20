"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { posApi } from "@/lib/api";
import { useDevice } from "@/lib/useDevice";
import {
  formatIDR,
  cleanProductDescription,
  decodeTableToken,
  encodeTableToken,
  formatWhatsAppNumber,
  generateReceiptTextMessage,
  type TableMenuItem,
  type TableMenuCategory,
  type TableMenuFacility,
  type SalesOrderRecord,
  type MidtransConfigResponse,
  type MidtransSnapTokenResult,
  type MidtransChargeResult,
  type CheckTableDinerResult,
  type SendTableReceiptResult,
} from "@pz/shared";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
      embed?: (token: string, options?: any) => void;
    };
  }
}

interface CartOrderItem {
  product: TableMenuItem;
  quantity: number;
  notes: string;
}

function getFoodBeverageImage(product: TableMenuItem): string {
  if (product.imageUrl && product.imageUrl.trim().length > 0) {
    return product.imageUrl;
  }

  const name = (product.name || "").toLowerCase();
  const cat = (product.categoryName || "").toLowerCase();

  // Coffee / Espresso
  if (name.includes("espresso") || name.includes("americano")) {
    return "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("latte") || name.includes("cappuccino") || name.includes("macchiato") || name.includes("kopi")) {
    return "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("mocha") || name.includes("chocolate") || name.includes("cocoa")) {
    return "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("cold brew") || name.includes("iced coffee") || name.includes("frappe")) {
    return "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("tea") || name.includes("matcha") || name.includes("chai")) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("juice") || name.includes("smoothie") || name.includes("lemonade") || name.includes("soda") || name.includes("mineral") || name.includes("water")) {
    return "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&auto=format&fit=crop&q=80";
  }
  // Food / Bakery / Pastry
  if (name.includes("croissant") || name.includes("pastry") || name.includes("bread") || name.includes("toast")) {
    return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("cake") || name.includes("brownie") || name.includes("donut") || name.includes("cookie") || name.includes("dessert") || name.includes("sweet")) {
    return "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("burger") || name.includes("sandwich") || name.includes("hotdog")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("noodle") || name.includes("pasta") || name.includes("spaghetti") || name.includes("ramen") || name.includes("mie")) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("rice") || name.includes("nasi") || name.includes("curry") || name.includes("bowl") || name.includes("chicken") || name.includes("beef") || name.includes("steak")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("snack") || name.includes("fries") || name.includes("potato") || name.includes("finger")) {
    return "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80";
  }
  if (cat.includes("beverage") || cat.includes("drink") || cat.includes("minuman") || cat.includes("coffee") || cat.includes("kopi")) {
    return "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80";
  }
  // Default food photo
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80";
}

export function TableOrderClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  // Read encoded message / token from query parameter or route parameter
  const codeParam = (
    searchParams.get("code") ||
    searchParams.get("token") ||
    searchParams.get("data") ||
    (params?.code as string) ||
    ""
  ).trim();

  // Decode table token if present
  const decodedToken = useMemo(() => {
    if (!codeParam) return null;
    return decodeTableToken(codeParam);
  }, [codeParam]);

  const facilityIdParam = searchParams.get("facilityId");
  const tableNumberParam = searchParams.get("tableNumber");

  const facilityId = decodedToken?.facilityId ?? (facilityIdParam ? Number(facilityIdParam) : null);
  const tableNumber = decodedToken?.tableNumber ?? (tableNumberParam || "").trim();

  // Normalize address bar: if accessed via plaintext query params, replace with encoded message without reload
  useEffect(() => {
    if (facilityId && tableNumber && !codeParam && typeof window !== "undefined") {
      try {
        const encoded = encodeTableToken(facilityId, tableNumber);
        const newUrl = `${window.location.pathname}?code=${encoded}`;
        window.history.replaceState(null, "", newUrl);
      } catch (e) {
        // ignore
      }
    }
  }, [facilityId, tableNumber, codeParam]);

  // Menu data
  const [facilityInfo, setFacilityInfo] = useState<TableMenuFacility | null>(null);
  const [categories, setCategories] = useState<TableMenuCategory[]>([]);
  const [products, setProducts] = useState<TableMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Device detection
  const device = useDevice();

  // In-session cart
  const [cart, setCart] = useState<CartOrderItem[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Item note modal
  const [editingItemNote, setEditingItemNote] = useState<{ productId: number; note: string } | null>(null);

  // Order submission details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isRecognizedDiner, setIsRecognizedDiner] = useState(false);
  const [dinerCheckResult, setDinerCheckResult] = useState<CheckTableDinerResult | null>(null);
  const [checkingDiner, setCheckingDiner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<SalesOrderRecord | null>(null);
  const [isDiningComplete, setIsDiningComplete] = useState(false);
  const [receiptDispatchResult, setReceiptDispatchResult] = useState<SendTableReceiptResult | null>(null);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptInputContact, setReceiptInputContact] = useState("");
  const [receiptToast, setReceiptToast] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [showChangeContactForm, setShowChangeContactForm] = useState(false);
  const [returnCountdown, setReturnCountdown] = useState<number>(10);
  const [isCountdownPaused, setIsCountdownPaused] = useState<boolean>(false);

  // Auto-return to customer main page 10 seconds after dining complete
  useEffect(() => {
    if (!isDiningComplete || isCountdownPaused) return;

    if (returnCountdown <= 0) {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      return;
    }

    const timer = setInterval(() => {
      setReturnCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isDiningComplete, returnCountdown, isCountdownPaused]);

  // Load diner details from persistent cookie/storage on initial mount
  useEffect(() => {
    try {
      let stored: { name?: string; phone?: string; email?: string } | null = null;
      if (typeof document !== "undefined") {
        const cookieRow = document.cookie
          .split("; ")
          .find((row) => row.startsWith("pz_table_customer="));
        if (cookieRow) {
          const val = cookieRow.split("=")[1];
          if (val) {
            stored = JSON.parse(decodeURIComponent(val));
          }
        }
      }
      if (!stored && typeof localStorage !== "undefined") {
        const local = localStorage.getItem("pz_table_customer");
        if (local) stored = JSON.parse(local);
      }
      if (stored) {
        if (stored.name) setCustomerName(stored.name);
        if (stored.phone) setCustomerPhone(stored.phone);
        if (stored.email) setCustomerEmail(stored.email);
        if (stored.name || stored.email || stored.phone) {
          setIsRecognizedDiner(true);
        }
      }
    } catch (e) {
      console.warn("Could not read diner cookie:", e);
    }
  }, []);

  const saveDinerCookie = (name: string, phone: string, email: string) => {
    try {
      const payload = JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      if (typeof document !== "undefined") {
        document.cookie = `pz_table_customer=${encodeURIComponent(payload)}; path=/; max-age=31536000; SameSite=Lax`;
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pz_table_customer", payload);
      }
    } catch (e) {
      // Ignore
    }
  };

  const clearDinerCookie = () => {
    if (typeof document !== "undefined") {
      document.cookie = "pz_table_customer=; path=/; max-age=0; SameSite=Lax";
    }
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("pz_table_customer");
    }
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setIsRecognizedDiner(false);
    setDinerCheckResult(null);
    setCheckingDiner(false);
  };

  // Real-time Diner Membership & Conflict Check (Option A)
  useEffect(() => {
    const email = customerEmail.trim();
    const phone = customerPhone.trim();
    const name = customerName.trim();

    if (!email && !phone) {
      setDinerCheckResult(null);
      setCheckingDiner(false);
      return;
    }

    setCheckingDiner(true);
    const timer = setTimeout(() => {
      posApi
        .checkTableDiner({ email: email || undefined, phone: phone || undefined, name: name || undefined })
        .then((res) => {
          const data = res.data;
          if (data) {
            setDinerCheckResult(data);
            if (data.emailRegistered || data.phoneRegistered) {
              setIsRecognizedDiner(true);
            }
          }
        })
        .catch((err) => {
          console.warn("Could not check diner status:", err);
        })
        .finally(() => {
          setCheckingDiner(false);
        });
    }, 450);

    return () => clearTimeout(timer);
  }, [customerEmail, customerPhone, customerName]);

  // Online Payment modal & state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"SNAP" | "EWALLET" | "BANK_TRANSFER" | "CARD">("SNAP");
  const [selectedVaBank, setSelectedVaBank] = useState<"BCA" | "MANDIRI" | "BRI" | "BNI">("BCA");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 mins
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);

  // Midtrans State
  const [midtransConfig, setMidtransConfig] = useState<MidtransConfigResponse | null>(null);
  const [midtransLoading, setMidtransLoading] = useState(false);
  const [activeDraftOrder, setActiveDraftOrder] = useState<SalesOrderRecord | null>(null);
  const [snapTokenData, setSnapTokenData] = useState<MidtransSnapTokenResult | null>(null);
  const [midtransChargeData, setMidtransChargeData] = useState<MidtransChargeResult | null>(null);

  // Load Midtrans Configuration and inject Snap script
  useEffect(() => {
    let isMounted = true;
    posApi
      .getMidtransConfig()
      .then((res) => {
        if (!isMounted || !res.data) return;
        setMidtransConfig(res.data);
        if (typeof window !== "undefined" && !document.getElementById("midtrans-snap-script")) {
          const script = document.createElement("script");
          script.id = "midtrans-snap-script";
          script.src = res.data.snapScriptUrl;
          script.setAttribute("data-client-key", res.data.clientKey);
          script.async = true;
          document.body.appendChild(script);
        }
      })
      .catch((err) => {
        console.warn("Could not load Midtrans config", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Card mock fields
  const [cardNumber, setCardNumber] = useState("4532 8190 2841 8821");
  const [cardExpiry, setCardExpiry] = useState("08/28");
  const [cardCvv, setCardCvv] = useState("892");
  const [cardHolder, setCardHolder] = useState("");

  const vaNumbers: Record<string, string> = {
    BCA: "8808 2910 4019 3321",
    MANDIRI: "8950 1829 4019 2201",
    BRI: "1029 8839 2019 4410",
    BNI: "9880 1829 4910 2239",
  };

  // Payment timer
  useEffect(() => {
    if (!isPaymentModalOpen) return;
    const timer = setInterval(() => {
      setPaymentTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaymentModalOpen]);

  // Load Menu for the specific scanned facility
  useEffect(() => {
    if (!facilityId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setLoadError(null);

    posApi
      .getTableMenu(facilityId)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data;
        if (data) {
          setFacilityInfo(data.facility ?? null);
          setCategories(data.categories || []);
          setProducts(data.products || []);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load table menu", err);
        setLoadError(err.message || "Unable to load menu. Please check your network connection.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [facilityId]);

  // Filtered products (with clean description stripping proprietary recipe specs)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === null || p.categoryId === selectedCategory;
      const cleanDesc = cleanProductDescription(p.description);
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cleanDesc && cleanDesc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const getItemQuantity = (productId: number) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const getItemNotes = (productId: number) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.notes : "";
  };

  const handleAddToCart = (product: TableMenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx]!, quantity: copy[idx]!.quantity + 1 };
        return copy;
      }
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === productId);
      if (idx === -1) return prev;
      const copy = [...prev];
      const newQty = copy[idx]!.quantity + delta;
      if (newQty <= 0) {
        copy.splice(idx, 1);
        return copy;
      }
      copy[idx] = { ...copy[idx]!, quantity: newQty };
      return copy;
    });
  };

  const handleSaveItemNote = (productId: number, note: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === productId);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx]!, notes: note };
      return copy;
    });
    setEditingItemNote(null);
  };

  // Cart Totals
  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  }, [cart]);

  // Handle Proceeding to Payment
  const handleOpenPaymentModal = () => {
    if (!facilityId || !tableNumber) {
      alert("Invalid table session. Please scan your table barcode.");
      return;
    }
    if (cart.length === 0) {
      alert("Your cart is empty. Please select items from the menu.");
      return;
    }
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  // Helper to ensure draft order exists in DB awaiting payment
  const ensureDraftOrder = async (): Promise<SalesOrderRecord> => {
    if (activeDraftOrder) return activeDraftOrder;

    saveDinerCookie(customerName, customerPhone, customerEmail);
    const res = await posApi.createTableOrder({
      facilityId: facilityId!,
      tableNumber: tableNumber!,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      notes: orderNotes.trim() || undefined,
      paymentMethod: selectedPaymentMethod === "SNAP" ? "EWALLET" : selectedPaymentMethod,
      paymentProvider: selectedPaymentMethod === "SNAP" ? "Midtrans Snap Gateway" : "Online Gateway",
      isPaid: false,
      items: cart.map((item) => ({
        productId: item.product.id,
        unitId: item.product.unitId,
        quantity: item.quantity,
        unitPrice: item.product.price,
        discountPercentage: 0,
        notes: item.notes.trim() || undefined,
      })),
    });

    const order = (res as any).data?.salesOrder || (res as any).data || (res as any).salesOrder;
    setActiveDraftOrder(order);
    return order;
  };

  // Pay with Midtrans Snap Gateway (all-in-one modal)
  const handlePayWithMidtransSnap = async () => {
    if (!facilityId || !tableNumber || cart.length === 0) return;
    setMidtransLoading(true);
    setPaymentError(null);

    try {
      const order = await ensureDraftOrder();

      const snapRes = await posApi.createMidtransSnapToken({
        salesOrderId: order.id,
        customerDetails: {
          name: customerName.trim() || `Table ${tableNumber}`,
          phone: customerPhone.trim() || undefined,
          email: customerEmail.trim() || undefined,
        },
      });

      const snapData = snapRes.data;
      setSnapTokenData(snapData);

      if (typeof window !== "undefined" && window.snap && !snapData?.isSimulated) {
        window.snap.pay(snapData.token, {
          onSuccess: async () => {
            const statusRes = await posApi.getTableOrderStatus(order.id);
            const finishedOrder = (statusRes as any).data?.order || order;
            setSubmittedOrder(finishedOrder);
            setCart([]);
            setIsPaymentModalOpen(false);
            setIsReviewOpen(false);
          },
          onPending: async () => {
            const statusRes = await posApi.getTableOrderStatus(order.id);
            const finishedOrder = (statusRes as any).data?.order || order;
            setSubmittedOrder(finishedOrder);
            setCart([]);
            setIsPaymentModalOpen(false);
            setIsReviewOpen(false);
          },
          onError: () => {
            setPaymentError("Midtrans transaction was declined or failed. Please try another method.");
          },
          onClose: () => {
            console.log("Customer closed Midtrans Snap popup without completing payment.");
          },
        });
      }
    } catch (err: any) {
      console.error("Midtrans Snap error", err);
      setPaymentError(err.message || "Unable to initiate Midtrans Snap payment.");
    } finally {
      setMidtransLoading(false);
    }
  };

  // Generate Core API Direct QRIS / VA Charge
  const handleGenerateCoreCharge = async (paymentType: "qris" | "bank_transfer", bank?: string) => {
    setMidtransLoading(true);
    setPaymentError(null);
    try {
      const order = await ensureDraftOrder();
      const res = await posApi.createMidtransCharge({
        salesOrderId: order.id,
        paymentType,
        bank: (bank?.toLowerCase() || undefined) as any,
        customerDetails: {
          name: customerName.trim() || `Table ${tableNumber}`,
          phone: customerPhone.trim() || undefined,
          email: customerEmail.trim() || undefined,
        },
      });
      setMidtransChargeData(res.data);
    } catch (err: any) {
      console.error("Midtrans charge error", err);
      setPaymentError(err.message || "Failed to generate payment details.");
    } finally {
      setMidtransLoading(false);
    }
  };

  // Simulate Instant Settlement (Sandbox/Test helper)
  const handleSimulateMidtransSettlement = async (method = "qris") => {
    setVerifyingPayment(true);
    setPaymentError(null);
    try {
      const order = await ensureDraftOrder();
      await posApi.simulateMidtransPayment(order.id, method);
      const statusRes = await posApi.getTableOrderStatus(order.id);
      const finishedOrder = (statusRes as any).data?.order || order;
      setSubmittedOrder(finishedOrder);
      setCart([]);
      setIsPaymentModalOpen(false);
      setIsReviewOpen(false);
    } catch (err: any) {
      console.error("Simulation error", err);
      setPaymentError(err.message || "Simulation failed. Please try again.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Handle Online Payment Settlement fallback (direct settlement)
  const handleExecuteOnlinePayment = async () => {
    if (!facilityId || !tableNumber) {
      alert("Invalid table session. Please scan your table barcode.");
      return;
    }
    if (cart.length === 0) {
      alert("Your cart is empty. Please select items from the menu.");
      return;
    }

    try {
      setVerifyingPayment(true);
      setPaymentError(null);

      const refNumber = `PAY-${Date.now().toString().slice(-8)}`;
      const providerName =
        selectedPaymentMethod === "SNAP"
          ? "Midtrans Snap Gateway"
          : selectedPaymentMethod === "EWALLET"
          ? "QRIS (GoPay/OVO/Dana/BCA)"
          : selectedPaymentMethod === "BANK_TRANSFER"
          ? `${selectedVaBank} Virtual Account`
          : "Credit/Debit Card Online";

      const methodEnum = selectedPaymentMethod === "SNAP" ? "EWALLET" : selectedPaymentMethod;

      saveDinerCookie(customerName, customerPhone, customerEmail);
      const res = await posApi.createTableOrder({
        facilityId,
        tableNumber,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        paymentMethod: methodEnum,
        paymentProvider: providerName,
        referenceNumber: refNumber,
        isPaid: true,
        items: cart.map((item) => ({
          productId: item.product.id,
          unitId: item.product.unitId,
          quantity: item.quantity,
          unitPrice: item.product.price,
          discountPercentage: 0,
          notes: item.notes.trim() || undefined,
        })),
      });

      const order = (res as any).data?.salesOrder || (res as any).data || (res as any).salesOrder;
      setSubmittedOrder(order);
      setCart([]);
      setIsPaymentModalOpen(false);
      setIsReviewOpen(false);
    } catch (err: any) {
      console.error("Payment settlement error", err);
      setPaymentError(err.message || "Online payment verification failed. Please try again or alert a staff member.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  // ── Receipt Dispatch Helpers ──────────────────────────────────────────────
  const executeReceiptDispatch = async (
    targetChannel: "WHATSAPP" | "EMAIL",
    targetDestination: string,
    order: SalesOrderRecord
  ) => {
    setSendingReceipt(true);
    setReceiptToast(null);

    const effectiveName =
      customerName.trim() ||
      ((order as any)?.customer?.profile
        ? `${(order as any).customer.profile.firstName || ""} ${(order as any).customer.profile.lastName || ""}`.trim()
        : "") ||
      "Valued Diner";

    const paymentInfo = (order as any).payments?.[0];
    const paymentMethodLabel = paymentInfo?.notes || paymentInfo?.method || "PAID (Online)";

    const receiptText = generateReceiptTextMessage({
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber || tableNumber,
      facilityName: facilityInfo?.facilityName || order.facility?.facilityName,
      address: facilityInfo?.address || (order.facility as any)?.address,
      customerName: effectiveName,
      orderDate: order.orderDate || new Date().toISOString(),
      items: order.items?.map((it: any) => ({
        name: it.productName || it.name,
        quantity: it.quantity,
        totalPrice: it.totalPrice,
        notes: it.notes,
      })),
      subtotal: order.subtotal,
      grandTotal: order.grandTotal,
      paymentMethod: paymentMethodLabel,
    });

    let waUrl: string | null = null;
    let mailtoUrl: string | null = null;

    if (targetChannel === "WHATSAPP") {
      const cleanPhone = formatWhatsAppNumber(targetDestination);
      waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptText)}`;
      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
      setReceiptDispatchResult({
        success: true,
        channel: "WHATSAPP",
        destination: cleanPhone,
        message: receiptText,
        waUrl,
      });
      setReceiptToast(`✓ Official receipt dispatched to WhatsApp (+${cleanPhone})`);
    } else {
      const cleanEmail = targetDestination.trim();
      mailtoUrl = `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(
        `Receipt for Order #${order.orderNumber}`
      )}&body=${encodeURIComponent(receiptText)}`;
      if (typeof window !== "undefined") {
        window.location.href = mailtoUrl;
      }
      setReceiptDispatchResult({
        success: true,
        channel: "EMAIL",
        destination: cleanEmail,
        message: receiptText,
        mailtoUrl,
      });
      setReceiptToast(`✓ Official receipt dispatched to Email (${cleanEmail})`);
    }

    try {
      await posApi.sendTableReceipt({
        salesOrderId: order.id,
        channel: targetChannel,
        destination: targetDestination,
        customerName: effectiveName,
      });
    } catch (err: any) {
      console.warn("Could not record receipt dispatch on server:", err);
    } finally {
      setSendingReceipt(false);
    }
  };

  // Called when diner clicks "✓ Done" on post-payment screen
  const handleDoneClick = async () => {
    if (!submittedOrder) {
      setReturnCountdown(10);
      setIsDiningComplete(true);
      return;
    }

    const phone =
      customerPhone.trim() ||
      (submittedOrder as any)?.customer?.profile?.whatsapp ||
      (submittedOrder as any)?.customer?.profile?.phoneNumber ||
      "";

    const email =
      customerEmail.trim() ||
      (submittedOrder as any)?.customer?.profile?.email ||
      "";

    // Priority 1: Send to WhatsApp if phone exists
    if (phone) {
      const cleanPhone = formatWhatsAppNumber(phone);
      executeReceiptDispatch("WHATSAPP", phone, submittedOrder);
      if (typeof window !== "undefined") {
        window.alert(`Official sales receipt has been sent to your WhatsApp number (+${cleanPhone})!`);
      }
      setReturnCountdown(10);
      setIsDiningComplete(true);
      return;
    }

    // Priority 2: If WhatsApp does not exist, send to email
    if (email) {
      executeReceiptDispatch("EMAIL", email, submittedOrder);
      if (typeof window !== "undefined") {
        window.alert(`Official sales receipt has been sent to your email (${email.trim()})!`);
      }
      setReturnCountdown(10);
      setIsDiningComplete(true);
      return;
    }

    // If neither exists, navigate to Thank You screen with receipt input
    if (typeof window !== "undefined") {
      window.alert("Thank you! Please enter your WhatsApp number or email to receive your official sales receipt.");
    }
    setReturnCountdown(10);
    setIsDiningComplete(true);
  };

  // Called when diner enters or changes receipt contact on Thank You screen
  const handleSendManualReceipt = async () => {
    const target = receiptInputContact.trim();
    if (!target) {
      alert("Please enter a WhatsApp number or email address.");
      return;
    }
    if (!submittedOrder) {
      alert("No active order found to send receipt.");
      return;
    }

    const isEmail = target.includes("@");
    const channel: "WHATSAPP" | "EMAIL" = isEmail ? "EMAIL" : "WHATSAPP";

    await executeReceiptDispatch(channel, target, submittedOrder);
    if (typeof window !== "undefined") {
      const formatted = channel === "WHATSAPP" ? `+${formatWhatsAppNumber(target)}` : target;
      window.alert(`Official sales receipt has been sent to ${formatted}!`);
    }
    setReceiptInputContact("");
    setShowChangeContactForm(false);
    setReturnCountdown(10);
  };

  // ── Missing Table or Facility Screen (Customer cannot set/change them) ──
  if (!facilityId || !tableNumber) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            padding: "2.5rem 1.5rem",
            boxShadow: "var(--shadow-glass)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              border: "2px solid var(--border-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              fontSize: "2.2rem",
            }}
          >
            📷
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>Please Scan Your Table Barcode</h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginTop: "0.5rem",
              lineHeight: 1.5,
            }}
          >
            To browse our digital menu and place an order, please scan the QR code sticker located directly on your dining table.
          </p>
          <div
            style={{
              marginTop: "1.5rem",
              padding: "0.85rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            Table numbers and store locations are assigned automatically by the scanned QR code.
          </div>
        </div>
      </div>
    );
  }

  // ── Dining Complete / Thank You Screen (after customer clicks Done) ───────────
  if (isDiningComplete) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-glow)",
            padding: "2.25rem 1.75rem",
            boxShadow: "var(--shadow-glass)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              height: "44px",
              width: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(212, 175, 55, 0.3))",
              marginBottom: "1.25rem",
            }}
          />

          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "3px solid var(--accent-emerald)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              marginBottom: "1.15rem",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
            }}
          >
            🎉
          </div>

          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
            Thank You for Dining With Us!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            We hope you enjoy your time at{" "}
            <strong style={{ color: "var(--text-primary)" }}>{facilityInfo?.facilityName || "Chrono"}</strong>.
            Your order is being served directly to{" "}
            <strong style={{ color: "var(--accent-emerald)" }}>🪑 Table {tableNumber}</strong>.
          </p>

          {/* Automatic Return to Customer Main Page in 10s */}
          <div
            id="return-to-cafe-countdown-card"
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              marginBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>⏱️</span>
                <span>
                  {isCountdownPaused
                    ? "Auto-return paused"
                    : "Returning to Cafe Main Page in "}
                  {!isCountdownPaused && (
                    <strong style={{ color: "var(--primary)", fontSize: "0.95rem" }}>
                      {returnCountdown}s
                    </strong>
                  )}
                </span>
              </span>

              <button
                id="pause-return-countdown-btn"
                type="button"
                onClick={() => setIsCountdownPaused(!isCountdownPaused)}
                style={{
                  background: "none",
                  border: "none",
                  color: isCountdownPaused ? "var(--accent-emerald)" : "var(--text-muted)",
                  fontSize: "0.74rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                {isCountdownPaused ? "Resume (Return in 10s)" : "Stay on this page"}
              </button>
            </div>

            {/* Visual progress bar */}
            {!isCountdownPaused && (
              <div
                style={{
                  width: "100%",
                  height: "4px",
                  borderRadius: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(0, Math.min(100, (returnCountdown / 10) * 100))}%`,
                    backgroundColor: "var(--primary)",
                    transition: "width 1s linear",
                  }}
                />
              </div>
            )}

            <button
              id="go-cafe-main-page-now-btn"
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                marginTop: "0.15rem",
                padding: "0.45rem",
                backgroundColor: "transparent",
                color: "var(--primary)",
                border: "1px dashed var(--primary)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
                transition: "all var(--transition-fast)",
              }}
            >
              ← Go to Cafe Main Page Now
            </button>
          </div>

          {/* Receipt Toast Notification */}
          {receiptToast && (
            <div
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid var(--accent-emerald)",
                color: "var(--accent-emerald)",
                fontSize: "0.82rem",
                fontWeight: 700,
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              {receiptToast}
            </div>
          )}

          {/* Receipt Dispatch Status Card */}
          {receiptDispatchResult && (
            <div
              style={{
                width: "100%",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                marginBottom: "1rem",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "1.2rem" }}>
                  {receiptDispatchResult.channel === "WHATSAPP" ? "💬" : "✉️"}
                </span>
                <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--accent-emerald)" }}>
                  Receipt Sent to {receiptDispatchResult.channel === "WHATSAPP" ? "WhatsApp" : "Email"}
                </span>
              </div>
              <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Delivered to: <strong style={{ color: "var(--text-primary)" }}>{receiptDispatchResult.channel === "WHATSAPP" ? `+${receiptDispatchResult.destination}` : receiptDispatchResult.destination}</strong>
              </p>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {receiptDispatchResult.channel === "WHATSAPP" && receiptDispatchResult.waUrl && (
                  <a
                    id="open-whatsapp-chat-btn"
                    href={receiptDispatchResult.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: "1 1 auto",
                      padding: "0.55rem 0.8rem",
                      backgroundColor: "#25D366",
                      color: "#ffffff",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      borderRadius: "var(--radius-sm)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      boxShadow: "0 2px 6px rgba(37, 211, 102, 0.3)",
                    }}
                  >
                    <span>💬</span>
                    <span>Open in WhatsApp</span>
                  </a>
                )}

                {receiptDispatchResult.channel === "EMAIL" && receiptDispatchResult.mailtoUrl && (
                  <a
                    id="open-email-client-btn"
                    href={receiptDispatchResult.mailtoUrl}
                    style={{
                      flex: "1 1 auto",
                      padding: "0.55rem 0.8rem",
                      backgroundColor: "var(--primary)",
                      color: "#ffffff",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      borderRadius: "var(--radius-sm)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      boxShadow: "0 2px 6px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <span>✉️</span>
                    <span>Open Email App</span>
                  </a>
                )}

                <button
                  id="copy-receipt-btn"
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(receiptDispatchResult.message);
                      setCopiedReceipt(true);
                      setTimeout(() => setCopiedReceipt(false), 2500);
                    }
                  }}
                  style={{
                    flex: "1 1 auto",
                    padding: "0.55rem 0.8rem",
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>{copiedReceipt ? "✓" : "📋"}</span>
                  <span>{copiedReceipt ? "Copied!" : "Copy Receipt"}</span>
                </button>
              </div>

              <div style={{ marginTop: "0.65rem", textAlign: "right" }}>
                <button
                  type="button"
                  onClick={() => setShowChangeContactForm(!showChangeContactForm)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "0.74rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  {showChangeContactForm ? "Cancel resend" : "Send to another WhatsApp or Email"}
                </button>
              </div>
            </div>
          )}

          {/* Manual Contact Entry (when no contact was provided or resend requested) */}
          {(!receiptDispatchResult || showChangeContactForm) && (
            <div
              style={{
                width: "100%",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-glow)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                marginBottom: "1rem",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "1.1rem" }}>📱</span>
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                  {receiptDispatchResult ? "Resend Digital Receipt" : "Receive Your Digital Receipt"}
                </span>
              </div>
              <p style={{ margin: "0 0 0.65rem 0", fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                Enter your WhatsApp number (e.g. 08123456789) or Email to receive your official order receipt.
              </p>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  id="receipt-contact-input"
                  type="text"
                  value={receiptInputContact}
                  onChange={(e) => setReceiptInputContact(e.target.value)}
                  placeholder="08xxxxxxxx or diner@email.com"
                  style={{
                    flex: 1,
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.82rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                <button
                  id="submit-manual-receipt-btn"
                  type="button"
                  onClick={handleSendManualReceipt}
                  disabled={sendingReceipt || !receiptInputContact.trim()}
                  style={{
                    padding: "0.55rem 0.85rem",
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    cursor: sendingReceipt || !receiptInputContact.trim() ? "not-allowed" : "pointer",
                    opacity: sendingReceipt || !receiptInputContact.trim() ? 0.6 : 1,
                  }}
                >
                  {sendingReceipt ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          )}

          {/* Order Details Box */}
          <div
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              textAlign: "left",
              fontSize: "0.82rem",
              marginBottom: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
            }}
          >
            {submittedOrder?.orderNumber && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Order Reference:</span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{submittedOrder.orderNumber}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Table:</span>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Table {tableNumber}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Status:</span>
              <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>✓ Paid &amp; In Kitchen</span>
            </div>
          </div>

          {/* Receipt Breakdown Collapsible */}
          <div style={{ width: "100%", marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={() => setShowReceiptDetails(!showReceiptDetails)}
              style={{
                width: "100%",
                background: "none",
                border: "1px dashed var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "0.5rem 0.75rem",
                color: "var(--text-secondary)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>🧾 {showReceiptDetails ? "Hide Full Receipt Details" : "View Full Digital Receipt"}</span>
              <span>{showReceiptDetails ? "▲" : "▼"}</span>
            </button>

            {showReceiptDetails && submittedOrder && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.85rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  textAlign: "left",
                  fontSize: "0.78rem",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "0.35rem", color: "var(--text-primary)" }}>
                  Ordered Items:
                </div>
                {submittedOrder.items?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>
                      {item.quantity}x {item.productName || item.name}
                    </span>
                    <span style={{ fontWeight: 600 }}>Rp {Number(item.totalPrice).toLocaleString("id-ID")}</span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px dashed var(--border-subtle)",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span>Total Paid:</span>
                  <span style={{ color: "var(--accent-emerald)" }}>{formatIDR(submittedOrder.grandTotal)}</span>
                </div>
              </div>
            )}
          </div>

          <button
            id="reopen-table-menu-btn"
            onClick={() => {
              setIsDiningComplete(false);
              setSubmittedOrder(null);
              setActiveDraftOrder(null);
              setReceiptDispatchResult(null);
              setCart([]);
            }}
            style={{
              width: "100%",
              padding: "0.85rem",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.95rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              transition: "background var(--transition-fast)",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              marginBottom: "0.75rem",
            }}
          >
            🍽️ Reopen Table Menu / Order More
          </button>

          <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>
            You can close this tab or keep it open to check the menu anytime.
          </p>
        </div>
      </div>
    );
  }

  // ── Success Confirmation Screen ──────────────────────────────────────────
  if (submittedOrder) {
    const paymentInfo = (submittedOrder as any).payments?.[0];
    const paymentMethodLabel = paymentInfo?.notes || paymentInfo?.method || "Online Payment";

    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-glow)",
            padding: "2rem 1.5rem",
            textAlign: "center",
            boxShadow: "var(--shadow-glass)",
          }}
        >
          {/* Animated Green Badge */}
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "3px solid var(--accent-emerald)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              fontSize: "2.4rem",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.35)",
            }}
          >
            ✅
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Payment Verified &amp; Settled!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.35rem", lineHeight: 1.5 }}>
            Your meal order has been paid online and received by the kitchen. Preparation has begun!
          </p>

          {/* Kitchen Status Pill */}
          <div
            style={{
              margin: "1.25rem auto 1.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              color: "var(--accent-amber)",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-amber)",
                display: "inline-block",
                boxShadow: "0 0 8px var(--accent-amber)",
              }}
            />
            <span>🍳 In Kitchen • Being Cooked Now</span>
          </div>

          {/* Order & Payment Summary Card */}
          <div
            style={{
              margin: "0 0 1.5rem 0",
              padding: "1.2rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Order Reference:</span>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{submittedOrder.orderNumber}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Dining Table:</span>
              <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                🪑 Table {submittedOrder.tableNumber || tableNumber}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Store Outlet:</span>
              <span>{facilityInfo?.facilityName || "Main Outlet"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Payment Method:</span>
              <span style={{ fontWeight: 600 }}>{paymentMethodLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Payment Status:</span>
              <span style={{ fontWeight: 800, color: "var(--accent-emerald)" }}>PAID (SETTLED)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Kitchen Order Status:</span>
              <span style={{ fontWeight: 800, color: "var(--accent-amber)" }}>COMPLETED &amp; PROCESSING</span>
            </div>

            {/* Items Breakdown */}
            {submittedOrder.items && submittedOrder.items.length > 0 && (
              <div
                style={{
                  borderTop: "1px dashed var(--border-subtle)",
                  paddingTop: "0.6rem",
                  marginTop: "0.2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>
                  Items Ordered:
                </div>
                {submittedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span>
                      {item.quantity}x {item.productName || item.product?.productName}
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatIDR(Number(item.totalPrice))}</span>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "0.6rem",
                marginTop: "0.2rem",
                fontWeight: 800,
                fontSize: "1rem",
              }}
            >
              <span>Grand Total Paid:</span>
              <span style={{ color: "var(--accent-emerald)" }}>{formatIDR(submittedOrder.grandTotal)}</span>
            </div>
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
            Staff will deliver your freshly prepared order directly to <strong>Table {tableNumber}</strong>. Sit back and enjoy!
          </p>

          {/* Action Buttons: Order Additional Food & Done */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              width: "100%",
            }}
          >
            <button
              id="order-additional-food-btn"
              onClick={() => {
                setSubmittedOrder(null);
                setActiveDraftOrder(null);
                setCart([]);
                setIsDiningComplete(false);
              }}
              style={{
                padding: "0.85rem 0.5rem",
                backgroundColor: "var(--bg-surface-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                fontWeight: 700,
                fontSize: device.isSmallScreen ? "0.82rem" : "0.88rem",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <span>+</span>
              <span>Order Additional Food</span>
            </button>

            <button
              id="order-done-btn"
              onClick={handleDoneClick}
              disabled={sendingReceipt}
              style={{
                padding: "0.85rem 0.5rem",
                backgroundColor: "var(--accent-emerald)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: device.isSmallScreen ? "0.85rem" : "0.92rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: sendingReceipt ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                transition: "all var(--transition-fast)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                opacity: sendingReceipt ? 0.75 : 1,
              }}
            >
              <span>{sendingReceipt ? "⏳" : "✓"}</span>
              <span>{sendingReceipt ? "Sending Receipt..." : "Done"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        paddingBottom: totalItemCount > 0 ? "110px" : "2rem",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      {/* Top Banner / Store Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: "rgba(17, 22, 34, 0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0.65rem 0.85rem",
          maxWidth: "100vw",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {/* Logo, Outlet Title & Blended Table Information */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.65rem", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  height: device.isSmallScreen ? "32px" : "38px",
                  width: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 8px rgba(212, 175, 55, 0.25))",
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1
                  style={{
                    fontSize: device.isSmallScreen ? "0.95rem" : "1.08rem",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    lineHeight: 1.25,
                    margin: 0,
                  }}
                >
                  {facilityInfo?.facilityName || "Digital Table Menu"}
                </h1>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    flexWrap: "wrap",
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "0.15rem",
                    lineHeight: 1.3,
                  }}
                >
                  {facilityInfo?.address && (
                    <span style={{ wordBreak: "break-word" }}>{facilityInfo.address}</span>
                  )}
                  {facilityInfo?.address && tableNumber && (
                    <span style={{ opacity: 0.5 }}>•</span>
                  )}
                  {tableNumber && (
                    <span
                      id="table-number-badge"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                      title="Table number is fixed to this table barcode"
                    >
                      <span>🪑</span>
                      <span>Table {tableNumber}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recognized Diner Welcome Pill */}
          {isRecognizedDiner && (
            <div
              style={{
                marginTop: "0.35rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0, overflow: "hidden" }}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  👋 Welcome back, <strong style={{ color: "var(--text-primary)" }}>{customerName || "Friend"}</strong>!
                </span>
                <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.66rem", flexShrink: 0 }}>• Recognized</span>
              </div>
              <button
                type="button"
                onClick={clearDinerCookie}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.68rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                  flexShrink: 0,
                  marginLeft: "0.5rem",
                }}
              >
                Switch
              </button>
            </div>
          )}

          {/* Menu Category Dropdown & Quick Search Bar */}
          <div
            style={{
              marginTop: "0.45rem",
              display: "flex",
              gap: "0.45rem",
              alignItems: "center",
              flexWrap: "wrap",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Category Dropdown List */}
            <div style={{ position: "relative", flex: "1 1 125px", minWidth: 0 }}>
              <select
                id="table-category-select"
                value={selectedCategory === null ? "ALL" : selectedCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategory(val === "ALL" ? null : Number(val));
                }}
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 1.8rem 0 0.75rem",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: selectedCategory !== null ? "1px solid var(--border-glow)" : "1px solid var(--border-subtle)",
                  color: selectedCategory !== null ? "var(--primary)" : "var(--text-primary)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="ALL">🍽️ All ({products.length})</option>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({count})
                    </option>
                  );
                })}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                }}
              >
                ▼
              </span>
            </div>

            {/* Quick Search Bar */}
            <div style={{ position: "relative", flex: "1 1 150px", minWidth: 0 }}>
              <input
                id="table-search-input"
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 1.8rem 0 2rem",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "0.82rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "0.65rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "0.65rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active Category Filter Tag if selected */}
          {selectedCategory !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                marginTop: "0.35rem",
                fontSize: "0.72rem",
                color: "var(--text-muted)",
              }}
            >
              <span>Category:</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.12rem 0.5rem",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "var(--primary)",
                  border: "1px solid var(--border-glow)",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                }}
              >
                {categories.find((c) => c.id === selectedCategory)?.name || "Category"}
                <button
                  onClick={() => setSelectedCategory(null)}
                  title="Clear category filter"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Product Catalog List */}
      <main style={{ maxWidth: "800px", margin: "0.6rem auto", padding: "0 0.75rem", width: "100%", flex: 1, boxSizing: "border-box" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>⏳</div>
            <p style={{ fontSize: "0.85rem" }}>Loading digital menu items...</p>
          </div>
        ) : loadError ? (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1.25rem",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p style={{ color: "var(--accent-rose)", fontWeight: 700, marginBottom: "0.5rem" }}>
              Menu Unavailable
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "1rem" }}>
              {loadError}
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1rem",
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔍</p>
            <p style={{ fontSize: "0.85rem" }}>No menu items matching your filter.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.6rem" }}>
            {filteredProducts.map((product) => {
              const qty = getItemQuantity(product.id);
              const note = getItemNotes(product.id);
              const imageSrc = getFoodBeverageImage(product);

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (qty === 0) {
                      handleAddToCart(product);
                    }
                  }}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "var(--radius-lg)",
                    border: qty > 0 ? "1px solid var(--border-glow)" : "1px solid var(--border-subtle)",
                    padding: device.isSmallScreen ? "0.65rem 0.75rem" : "0.85rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: device.isSmallScreen ? "0.7rem" : "1rem",
                    boxShadow: qty > 0 ? "0 4px 16px -4px rgba(99, 102, 241, 0.25)" : "none",
                    transition: "all var(--transition-fast)",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                >
                  {/* 1. Picture of the food & beverages to the left of each menu */}
                  <div
                    style={{
                      width: device.isSmallScreen ? "76px" : "92px",
                      height: device.isSmallScreen ? "76px" : "92px",
                      minWidth: device.isSmallScreen ? "76px" : "92px",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      position: "relative",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt={product.name}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform var(--transition-fast)",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80";
                      }}
                    />
                  </div>

                  {/* 2. Detail of the menu (Middle) */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.15rem" }}>
                      <span
                        style={{
                          fontSize: "0.64rem",
                          fontWeight: 700,
                          padding: "0.06rem 0.35rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        {product.categoryName}
                      </span>
                      {product.unitLabel && (
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          • {product.unitLabel}
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: device.isSmallScreen ? "0.88rem" : "0.98rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        margin: "0 0 0.15rem 0",
                        lineHeight: 1.25,
                        wordBreak: "break-word",
                      }}
                    >
                      {product.name}
                    </h3>

                    {cleanProductDescription(product.description) && (
                      <p
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-secondary)",
                          margin: "0 0 0.25rem 0",
                          lineHeight: 1.3,
                          wordBreak: "break-word",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {cleanProductDescription(product.description)}
                      </p>
                    )}

                    <div
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 800,
                        color: "var(--accent-emerald)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {formatIDR(product.price)}
                    </div>

                    {/* Note indicator / button if in cart */}
                    {qty > 0 && (
                      <div style={{ marginTop: "0.25rem" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItemNote({ productId: product.id, note });
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: note ? "var(--accent-amber)" : "var(--primary)",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <span>✏️</span>
                          <span>{note ? `Note: "${note}"` : "Add instruction"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Add Button (Right) */}
                  <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {qty === 0 ? (
                      <button
                        id={`add-btn-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        aria-label={`Add ${product.name} to order`}
                        style={{
                          minWidth: device.isSmallScreen ? "68px" : "78px",
                          height: device.isSmallScreen ? "34px" : "38px",
                          padding: device.isSmallScreen ? "0 0.65rem" : "0 0.85rem",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "var(--primary)",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: device.isSmallScreen ? "0.78rem" : "0.82rem",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.25rem",
                          boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
                          transition: "transform var(--transition-fast)",
                          touchAction: "manipulation",
                        }}
                      >
                        <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
                        <span>Add</span>
                      </button>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          backgroundColor: "var(--bg-surface-elevated)",
                          borderRadius: "var(--radius-full)",
                          padding: "0.18rem",
                          border: "1px solid var(--border-glow)",
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(product.id, -1);
                          }}
                          aria-label="Decrease quantity"
                          style={{
                            width: device.isSmallScreen ? "28px" : "32px",
                            height: device.isSmallScreen ? "28px" : "32px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                            color: "var(--text-primary)",
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            touchAction: "manipulation",
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            minWidth: "18px",
                            textAlign: "center",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            color: "var(--primary)",
                          }}
                        >
                          {qty}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(product.id, 1);
                          }}
                          aria-label="Increase quantity"
                          style={{
                            width: device.isSmallScreen ? "28px" : "32px",
                            height: device.isSmallScreen ? "28px" : "32px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "var(--primary)",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            touchAction: "manipulation",
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItemCount > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "0.75rem",
            left: "0.75rem",
            right: "0.75rem",
            zIndex: 50,
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <div
            id="floating-cart-review-btn"
            onClick={() => setIsReviewOpen(true)}
            style={{
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              borderRadius: "var(--radius-lg)",
              padding: "0.75rem 1.1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
              transition: "transform var(--transition-fast)",
              touchAction: "manipulation",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.25)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                }}
              >
                {totalItemCount}
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontSize: "0.72rem", opacity: 0.9 }}>Your Order</span>
                <span style={{ fontSize: "1rem", fontWeight: 800 }}>{formatIDR(grandTotal)}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, fontSize: "0.9rem" }}>
              <span>Review Order</span>
              <span>→</span>
            </div>
          </div>
        </div>
      )}

      {/* Item Note Modal */}
      {editingItemNote && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 65,
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Special Instructions
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              e.g. Less ice, no onions, sauce on the side, extra spicy.
            </p>
            <textarea
              id="item-special-note-input"
              rows={3}
              value={editingItemNote.note}
              onChange={(e) =>
                setEditingItemNote((prev) => (prev ? { ...prev, note: e.target.value } : null))
              }
              placeholder="Type your preferences here..."
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
                resize: "none",
              }}
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                onClick={() => setEditingItemNote(null)}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleSaveItemNote(editingItemNote.productId, editingItemNote.note)
                }
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Order Sheet / Modal */}
      {isReviewOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--bg-surface)",
              borderTopLeftRadius: "var(--radius-lg)",
              borderTopRightRadius: "var(--radius-lg)",
              border: "1px solid var(--border-glow)",
              boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
            }}
          >
            {/* Sheet Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Review Your Order</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>
                  🪑 Table {tableNumber} • {facilityInfo?.facilityName || "Outlet"}
                </span>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Items List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      paddingBottom: "0.75rem",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: "0.75rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.product.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                        {formatIDR(item.product.price)} each
                      </div>
                      {item.notes ? (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--accent-amber)",
                            marginTop: "0.2rem",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setEditingItemNote({ productId: item.product.id, note: item.notes })
                          }
                        >
                          ✏️ &quot;{item.notes}&quot;
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            marginTop: "0.2rem",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setEditingItemNote({ productId: item.product.id, note: "" })
                          }
                        >
                          + Add note
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          backgroundColor: "var(--bg-surface-elevated)",
                          borderRadius: "var(--radius-full)",
                          padding: "0.15rem 0.35rem",
                        }}
                      >
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            border: "none",
                            background: "none",
                            color: "var(--text-primary)",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 700, minWidth: "16px", textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            border: "none",
                            background: "none",
                            color: "var(--primary)",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          minWidth: "75px",
                          textAlign: "right",
                          fontSize: "0.95rem",
                        }}
                      >
                        {formatIDR(item.quantity * item.product.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guest Details & Table Instructions */}
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "1rem",
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>Diner Details (Optional)</span>
                    {dinerCheckResult?.isConflict ? (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          color: "var(--accent-amber)",
                          border: "1px solid rgba(245, 158, 11, 0.35)",
                        }}
                      >
                        ⚠️ Conflict Disambiguated
                      </span>
                    ) : (dinerCheckResult?.emailRegistered || dinerCheckResult?.phoneRegistered || isRecognizedDiner) ? (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        ✓ Recognized Member
                      </span>
                    ) : null}
                  </div>
                  {(isRecognizedDiner || customerName || customerEmail || customerPhone) && (
                    <button
                      type="button"
                      onClick={clearDinerCookie}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      (Clear)
                    </button>
                  )}
                </div>

                {checkingDiner && (
                  <div
                    style={{
                      padding: "0.4rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>🔄</span>
                    <span>Checking membership records...</span>
                  </div>
                )}

                {/* Option A Conflict Alert */}
                {!checkingDiner && dinerCheckResult?.isConflict && (
                  <div
                    id="diner-conflict-alert"
                    style={{
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      fontSize: "0.75rem",
                      color: "var(--accent-amber)",
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "0.15rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>⚠️</span>
                      <span>Separate Accounts Detected</span>
                    </div>
                    <div>
                      {dinerCheckResult.resolutionNote ||
                        `Your email and WhatsApp match two different accounts. Order will be linked to WhatsApp member '${dinerCheckResult.profileName || "Member"}' without altering either master record.`}
                    </div>
                  </div>
                )}

                {/* Recognized Customer Badge (No Conflict) */}
                {!checkingDiner && !dinerCheckResult?.isConflict && (dinerCheckResult?.emailRegistered || dinerCheckResult?.phoneRegistered || isRecognizedDiner) && (
                  <div
                    id="diner-recognized-alert"
                    style={{
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      fontSize: "0.76rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>👋 Welcome back, <strong style={{ color: "var(--text-primary)" }}>{dinerCheckResult?.profileName || customerName || "Friend"}</strong>! Order will be linked to your customer account.</span>
                  </div>
                )}

                {/* New Customer Info */}
                {!checkingDiner && !dinerCheckResult?.isConflict && !dinerCheckResult?.emailRegistered && !dinerCheckResult?.phoneRegistered && !isRecognizedDiner && (customerEmail || customerPhone || customerName) && (
                  <div
                    id="diner-new-alert"
                    style={{
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "rgba(99, 102, 241, 0.08)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      fontSize: "0.74rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>✨</span>
                    <span>New customer: We&apos;ll automatically create your account for order tracking and receipts.</span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Your Name:</label>
                    <input
                      id="table-customer-name-input"
                      type="text"
                      placeholder="e.g. Alex"
                      value={customerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomerName(val);
                        saveDinerCookie(val, customerPhone, customerEmail);
                      }}
                      style={{
                        width: "100%",
                        marginTop: "0.2rem",
                        padding: "0.5rem 0.65rem",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontSize: "16px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>WhatsApp / Phone:</label>
                    <input
                      id="table-customer-phone-input"
                      type="tel"
                      placeholder="e.g. 0812..."
                      value={customerPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomerPhone(val);
                        saveDinerCookie(customerName, val, customerEmail);
                      }}
                      style={{
                        width: "100%",
                        marginTop: "0.2rem",
                        padding: "0.5rem 0.65rem",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                        fontSize: "16px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Email Address (for receipt & customer perks):</label>
                  <input
                    id="table-customer-email-input"
                    type="email"
                    placeholder="e.g. alex@example.com"
                    value={customerEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerEmail(val);
                      saveDinerCookie(customerName, customerPhone, val);
                    }}
                    style={{
                      width: "100%",
                      marginTop: "0.2rem",
                      padding: "0.5rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>General Kitchen Note:</label>
                  <input
                    id="table-order-notes-input"
                    type="text"
                    placeholder="e.g. Please bring drinks first, extra napkins"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "0.2rem",
                      padding: "0.5rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      fontSize: "16px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sheet Footer */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-surface-elevated)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>Total Bill:</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
                  {formatIDR(grandTotal)}
                </span>
              </div>

              <button
                id="submit-table-order-btn"
                disabled={submitting}
                onClick={handleOpenPaymentModal}
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                }}
              >
                💳 Proceed to Online Payment • {formatIDR(grandTotal)}
              </button>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem",
                }}
              >
                <span>🔒</span>
                <span>Online payment required • Kitchen prepares order upon settlement</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Online Payment Modal ── */}
      {isPaymentModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 70,
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-glow)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.1rem 1.25rem",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--bg-surface-elevated)",
              }}
            >
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  Online Payment Checkout
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>
                  🪑 Table {tableNumber} • {totalItemCount} Items
                </div>
              </div>
              <button
                disabled={verifyingPayment}
                onClick={() => setIsPaymentModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  color: "var(--text-muted)",
                  cursor: verifyingPayment ? "not-allowed" : "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
              {/* Total Due Banner */}
              <div
                style={{
                  padding: "0.9rem 1rem",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Payment Due
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent-emerald)" }}>
                    {formatIDR(grandTotal)}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid var(--accent-emerald)",
                    borderRadius: "var(--radius-full)",
                    padding: "0.3rem 0.65rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--accent-emerald)",
                  }}
                >
                  ⚡ Direct Settlement
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Select Payment Method
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "0.35rem",
                    backgroundColor: "var(--bg-surface-elevated)",
                    padding: "0.3rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("SNAP")}
                    style={{
                      padding: "0.55rem 0.3rem",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      backgroundColor: selectedPaymentMethod === "SNAP" ? "var(--primary)" : "transparent",
                      color: selectedPaymentMethod === "SNAP" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.2rem",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span>✨</span>
                    <span>Midtrans</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("EWALLET")}
                    style={{
                      padding: "0.55rem 0.3rem",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      backgroundColor: selectedPaymentMethod === "EWALLET" ? "var(--primary)" : "transparent",
                      color: selectedPaymentMethod === "EWALLET" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.2rem",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span>📱</span>
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("BANK_TRANSFER")}
                    style={{
                      padding: "0.55rem 0.3rem",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      backgroundColor: selectedPaymentMethod === "BANK_TRANSFER" ? "var(--primary)" : "transparent",
                      color: selectedPaymentMethod === "BANK_TRANSFER" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.2rem",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span>🏛️</span>
                    <span>VA Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("CARD")}
                    style={{
                      padding: "0.55rem 0.3rem",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      backgroundColor: selectedPaymentMethod === "CARD" ? "var(--primary)" : "transparent",
                      color: selectedPaymentMethod === "CARD" ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.2rem",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span>💳</span>
                    <span>Card</span>
                  </button>
                </div>
              </div>

              {/* Payment Error Alert */}
              {paymentError && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid var(--accent-rose)",
                    color: "var(--accent-rose)",
                    fontSize: "0.8rem",
                    marginBottom: "1rem",
                  }}
                >
                  ⚠️ {paymentError}
                </div>
              )}

              {/* Tab 0: Midtrans Snap Gateway */}
              {selectedPaymentMethod === "SNAP" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div
                    style={{
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-glow)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.4rem" }}>⚡</span>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            Midtrans Snap Gateway
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                            All-in-one payment checkout for Indonesia
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.5rem",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: midtransConfig?.isConfigured
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(99, 102, 241, 0.15)",
                          color: midtransConfig?.isConfigured ? "var(--accent-emerald)" : "var(--primary)",
                          border: `1px solid ${midtransConfig?.isConfigured ? "var(--accent-emerald)" : "var(--primary)"}`,
                        }}
                      >
                        {midtransConfig?.isConfigured ? "Live Sandbox" : "Simulation Mode"}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.45,
                        backgroundColor: "var(--bg-surface)",
                        padding: "0.65rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      Supports <strong>GoPay, ShopeePay, QRIS, BCA/Mandiri/BNI/BRI/Permata Virtual Account</strong>, and <strong>Cards</strong>.
                    </div>
                  </div>

                  {/* Midtrans Snap Action Button */}
                  <button
                    id="midtrans-snap-pay-btn"
                    disabled={midtransLoading || verifyingPayment}
                    onClick={handlePayWithMidtransSnap}
                    style={{
                      width: "100%",
                      padding: "0.9rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary)",
                      color: "#ffffff",
                      fontSize: "1rem",
                      fontWeight: 800,
                      border: "none",
                      cursor: midtransLoading || verifyingPayment ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                      opacity: midtransLoading || verifyingPayment ? 0.7 : 1,
                    }}
                  >
                    {midtransLoading ? (
                      <>
                        <span style={{ animation: "spin 1s linear infinite" }}>🔄</span>
                        <span>Connecting to Midtrans...</span>
                      </>
                    ) : (
                      <>
                        <span>💳</span>
                        <span>Open Midtrans Snap • {formatIDR(grandTotal)}</span>
                      </>
                    )}
                  </button>

                  {/* Sandbox Instant Simulation Settlement Button */}
                  <div
                    style={{
                      padding: "0.85rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      border: "1px dashed var(--accent-emerald)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 700, marginBottom: "0.45rem" }}>
                      🧪 Developer &amp; QA Sandbox Test Action
                    </div>
                    <button
                      id="midtrans-simulate-instant-settlement-btn"
                      disabled={verifyingPayment}
                      onClick={() => handleSimulateMidtransSettlement("qris")}
                      style={{
                        width: "100%",
                        padding: "0.65rem",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--accent-emerald)",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: verifyingPayment ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                      }}
                    >
                      {verifyingPayment ? (
                        <>
                          <span style={{ animation: "spin 1s linear infinite" }}>🔄</span>
                          <span>Settling &amp; Deducting Recipe Stock...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Simulate Instant Midtrans Settlement</span>
                        </>
                      )}
                    </button>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                      Emulates Midtrans webhook callback: Marks order COMPLETED &amp; deducts ingredients.
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: QRIS Payment */}
              {selectedPaymentMethod === "EWALLET" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* Authentic QRIS Card Frame */}
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "280px",
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
                      border: "2px solid #e2e8f0",
                      marginBottom: "1rem",
                      textAlign: "center",
                      color: "#1e293b",
                    }}
                  >
                    {/* QRIS Red Header */}
                    <div
                      style={{
                        backgroundColor: "#c5161d",
                        color: "#ffffff",
                        padding: "0.45rem 0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "1px" }}>QRIS</div>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, opacity: 0.9 }}>
                        PEMBAYARAN DIGITAL NASIONAL
                      </div>
                    </div>

                    <div style={{ padding: "0.75rem 0.5rem 0.35rem" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0f172a" }}>
                        {facilityInfo?.facilityName?.toUpperCase() || "CHRONO CAFE & EATERY"}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "0.1rem" }}>
                        NMID: ID1020261984023 • A01
                      </div>

                      {/* QR Matrix SVG Graphic */}
                      <div
                        style={{
                          margin: "0.6rem auto 0.4rem",
                          width: "180px",
                          height: "180px",
                          padding: "8px",
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <svg
                          viewBox="0 0 100 100"
                          style={{ width: "100%", height: "100%", shapeRendering: "crispEdges" }}
                        >
                          {/* Top-left Finder Pattern */}
                          <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="2" />
                          <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="1" />
                          <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1" />

                          {/* Top-right Finder Pattern */}
                          <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="2" />
                          <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="1" />
                          <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1" />

                          {/* Bottom-left Finder Pattern */}
                          <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="2" />
                          <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="1" />
                          <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1" />

                          {/* Timing Patterns */}
                          <rect x="36" y="9" width="4" height="4" fill="#0f172a" />
                          <rect x="44" y="9" width="4" height="4" fill="#0f172a" />
                          <rect x="52" y="9" width="4" height="4" fill="#0f172a" />
                          <rect x="60" y="9" width="4" height="4" fill="#0f172a" />
                          <rect x="9" y="36" width="4" height="4" fill="#0f172a" />
                          <rect x="9" y="44" width="4" height="4" fill="#0f172a" />
                          <rect x="9" y="52" width="4" height="4" fill="#0f172a" />
                          <rect x="9" y="60" width="4" height="4" fill="#0f172a" />

                          {/* Data Modules */}
                          <rect x="37" y="20" width="4" height="8" fill="#0f172a" />
                          <rect x="45" y="17" width="8" height="4" fill="#0f172a" />
                          <rect x="57" y="20" width="4" height="8" fill="#0f172a" />
                          <rect x="40" y="30" width="6" height="6" fill="#0f172a" />
                          <rect x="54" y="32" width="6" height="4" fill="#0f172a" />
                          <rect x="20" y="37" width="8" height="4" fill="#0f172a" />
                          <rect x="20" y="45" width="4" height="8" fill="#0f172a" />
                          <rect x="28" y="54" width="4" height="6" fill="#0f172a" />
                          <rect x="68" y="37" width="6" height="8" fill="#0f172a" />
                          <rect x="78" y="40" width="8" height="4" fill="#0f172a" />
                          <rect x="88" y="37" width="4" height="8" fill="#0f172a" />
                          <rect x="72" y="52" width="6" height="6" fill="#0f172a" />
                          <rect x="82" y="50" width="8" height="4" fill="#0f172a" />
                          <rect x="37" y="68" width="6" height="6" fill="#0f172a" />
                          <rect x="47" y="68" width="8" height="4" fill="#0f172a" />
                          <rect x="59" y="70" width="4" height="8" fill="#0f172a" />
                          <rect x="40" y="78" width="8" height="4" fill="#0f172a" />
                          <rect x="52" y="82" width="8" height="6" fill="#0f172a" />
                          <rect x="68" y="72" width="6" height="8" fill="#0f172a" />
                          <rect x="78" y="68" width="4" height="8" fill="#0f172a" />
                          <rect x="86" y="74" width="6" height="6" fill="#0f172a" />
                          <rect x="70" y="84" width="8" height="6" fill="#0f172a" />
                          <rect x="82" y="86" width="6" height="4" fill="#0f172a" />

                          {/* Center QRIS Badge */}
                          <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#c5161d" strokeWidth="1.5" />
                          <text
                            x="50"
                            y="53.5"
                            textAnchor="middle"
                            fontSize="7.5"
                            fontWeight="900"
                            fill="#c5161d"
                          >
                            QR
                          </text>
                        </svg>
                      </div>

                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: "#c5161d",
                          letterSpacing: "0.2px",
                        }}
                      >
                        {formatIDR(grandTotal)}
                      </div>
                    </div>

                    {/* Supported Wallets Footer */}
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                        padding: "0.45rem 0.5rem",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.35rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>GoPay</span> • <span>OVO</span> • <span>DANA</span> • <span>ShopeePay</span> • <span>BCA</span> • <span>Livin</span>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--accent-amber)",
                      fontWeight: 600,
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>⏱️</span>
                    <span>
                      QR expires in {Math.floor(paymentTimer / 60)}:
                      {(paymentTimer % 60).toString().padStart(2, "0")}
                    </span>
                  </div>

                  {/* Simulated QRIS Payment Button */}
                  <button
                    id="simulate-qris-payment-btn"
                    disabled={verifyingPayment}
                    onClick={handleExecuteOnlinePayment}
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--accent-emerald)",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      border: "none",
                      cursor: verifyingPayment ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                      opacity: verifyingPayment ? 0.7 : 1,
                    }}
                  >
                    {verifyingPayment ? (
                      <>
                        <span style={{ animation: "spin 1s linear infinite" }}>🔄</span>
                        <span>Verifying QRIS Settlement...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Simulate &amp; Confirm QRIS Payment</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 2: Virtual Account */}
              {selectedPaymentMethod === "BANK_TRANSFER" && (
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    Select Your Bank:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.4rem", marginBottom: "1rem" }}>
                    {(["BCA", "MANDIRI", "BRI", "BNI"] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedVaBank(b)}
                        style={{
                          padding: "0.5rem 0.2rem",
                          borderRadius: "var(--radius-sm)",
                          border: `1px solid ${selectedVaBank === b ? "var(--primary)" : "var(--border-subtle)"}`,
                          backgroundColor: selectedVaBank === b ? "rgba(99, 102, 241, 0.15)" : "var(--bg-surface-elevated)",
                          color: selectedVaBank === b ? "var(--primary)" : "var(--text-primary)",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  {/* VA Number Card */}
                  <div
                    style={{
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-glow)",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {selectedVaBank} Virtual Account Number:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(vaNumbers[selectedVaBank] || "");
                          setCopiedVa(true);
                          setTimeout(() => setCopiedVa(false), 2000);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {copiedVa ? "✓ Copied!" : "📋 Copy"}
                      </button>
                    </div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        letterSpacing: "1.5px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {vaNumbers[selectedVaBank]}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      marginBottom: "1.25rem",
                      backgroundColor: "var(--bg-surface)",
                      padding: "0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <strong>How to transfer:</strong>
                    <ol style={{ paddingLeft: "1.2rem", marginTop: "0.35rem", marginBottom: 0 }}>
                      <li>Open your {selectedVaBank} Mobile Banking or ATM.</li>
                      <li>Go to Transfer &gt; Virtual Account.</li>
                      <li>Paste the number above and verify amount of {formatIDR(grandTotal)}.</li>
                    </ol>
                  </div>

                  <button
                    disabled={verifyingPayment}
                    onClick={handleExecuteOnlinePayment}
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary)",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      border: "none",
                      cursor: verifyingPayment ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                      opacity: verifyingPayment ? 0.7 : 1,
                    }}
                  >
                    {verifyingPayment ? "Checking VA Transfer..." : "Confirm VA Transfer Completed"}
                  </button>
                </div>
              )}

              {/* Tab 3: Credit / Debit Card */}
              {selectedPaymentMethod === "CARD" && (
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Card Number:</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 •••• •••• 8821"
                        style={{
                          width: "100%",
                          marginTop: "0.2rem",
                          padding: "0.55rem 0.65rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-surface-elevated)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Valid Thru:</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          style={{
                            width: "100%",
                            marginTop: "0.2rem",
                            padding: "0.55rem 0.65rem",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--bg-surface-elevated)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-primary)",
                            fontSize: "0.85rem",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CVV / CVC:</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          style={{
                            width: "100%",
                            marginTop: "0.2rem",
                            padding: "0.55rem 0.65rem",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--bg-surface-elevated)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-primary)",
                            fontSize: "0.85rem",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cardholder Name:</label>
                      <input
                        type="text"
                        value={cardHolder || customerName}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on card"
                        style={{
                          width: "100%",
                          marginTop: "0.2rem",
                          padding: "0.55rem 0.65rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-surface-elevated)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginBottom: "1rem",
                    }}
                  >
                    <span>🔒 256-bit Encrypted • Verified by Visa &amp; Mastercard ID Check</span>
                  </div>

                  <button
                    disabled={verifyingPayment}
                    onClick={handleExecuteOnlinePayment}
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--primary)",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      border: "none",
                      cursor: verifyingPayment ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                      opacity: verifyingPayment ? 0.7 : 1,
                    }}
                  >
                    {verifyingPayment ? "Processing Card Payment..." : `Pay ${formatIDR(grandTotal)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
