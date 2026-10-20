import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { cartStore, formatIDR, type ProductItem } from "@pz/shared";
import { productApi } from "../../src/lib/api";
import { theme } from "../../src/theme/tokens";

export default function MobilePosScreen() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartState, setCartState] = useState(cartStore.getState());

  useEffect(() => {
    const unsub = cartStore.subscribe((s) => setCartState(s));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await productApi.getProducts({ limit: 10 });
        setProducts(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mobile POS</Text>
        <Text style={styles.headerSub}>Fast touch counter & field register</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const cartItem = cartState.items.find((i) => i.productId === item.id);
          const qty = cartItem ? cartItem.quantity : 0;

          return (
            <TouchableOpacity
              style={[styles.productCard, qty > 0 && styles.productCardActive]}
              activeOpacity={0.7}
              onPress={() => {
                cartStore.getState().addItem({
                  id: item.id,
                  productName: item.productName,
                  unitPrice: item.retailPrice || 0,
                });
              }}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.productStock}>
                  {item.currentStock !== undefined && Number(item.currentStock) > 0
                    ? `Stock: ${item.currentStock}`
                    : item.hasFormula && (item.producibleStock ?? 0) > 0
                    ? `Made to order (${item.producibleStock})`
                    : item.hasFormula
                    ? "Out of ingredients"
                    : `Stock: ${item.currentStock ?? 0}`}
                </Text>
                <Text style={styles.productPrice}>
                  {item.retailPrice ? formatIDR(item.retailPrice) : "Price not set"}
                </Text>
              </View>

              {/* Explicit Add Button / Stepper Controls */}
              <View style={styles.actionContainer}>
                {qty === 0 ? (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      cartStore.getState().addItem({
                        id: item.id,
                        productName: item.productName,
                        unitPrice: item.retailPrice || 0,
                      });
                    }}
                  >
                    <Text style={styles.addButtonText}>+ Add</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtnMinus}
                      onPress={() => cartStore.getState().updateItemQuantity(item.id, qty - 1)}
                    >
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperCountText}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtnPlus}
                      onPress={() => cartStore.getState().updateItemQuantity(item.id, qty + 1)}
                    >
                      <Text style={styles.stepperBtnPlusText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No catalog items found.</Text>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => {
                cartStore.getState().addItem({
                  id: 101,
                  productName: "Field Aggregates (Demo)",
                  unitPrice: 120000,
                });
              }}
            >
              <Text style={styles.demoButtonText}>+ Add Demo Item</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Bottom Cart Bar */}
      <View style={styles.cartFooter}>
        <View>
          <Text style={styles.cartCount}>{cartState.items.length} item(s) in cart</Text>
          <Text style={styles.cartTotal}>{formatIDR(cartState.totals.grandTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, cartState.items.length === 0 && styles.checkoutDisabled]}
          disabled={cartState.items.length === 0}
          onPress={() => alert(`Ready for Phase 4 split payments: ${formatIDR(cartState.totals.grandTotal)}`)}
        >
          <Text style={styles.checkoutText}>Checkout →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  productCard: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: theme.colors.borderSubtle,
    borderWidth: 1,
  },
  productCardActive: {
    borderColor: theme.colors.borderGlow,
    backgroundColor: theme.colors.bgElevated,
  },
  productInfo: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  productStock: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.accentEmerald,
    marginTop: 4,
  },
  actionContainer: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.full || 9999,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.full || 9999,
    padding: 3,
    borderColor: theme.colors.borderGlow,
    borderWidth: 1,
  },
  stepperBtnMinus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnPlus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
  stepperBtnPlusText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  stepperCountText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 14,
    minWidth: 22,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  demoButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
  },
  demoButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  cartFooter: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: theme.colors.borderGlow,
    borderWidth: 1,
  },
  cartCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  checkoutBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  checkoutDisabled: {
    opacity: 0.5,
  },
  checkoutText: {
    color: "#fff",
    fontWeight: "700",
  },
});
