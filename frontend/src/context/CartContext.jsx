import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {

  /* ================= LOAD FROM LOCAL STORAGE ================= */
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  /* ================= SAVE TO LOCAL STORAGE ================= */
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const lineKey = (item) =>
    item.cartLineId != null ? String(item.cartLineId) : String(item.id);

  /* ================= ADD TO CART ================= */
  const addToCart = (product) => {
    setCart((prev) => {
      const key = lineKey(product);
      const existing = prev.find((item) => lineKey(item) === key);

      if (existing) {
        return prev.map((item) =>
          lineKey(item) === key
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          cartLineId: product.cartLineId ?? null,
          name: product.name,
          price: product.price,
          old_price: product.old_price ?? product.mrp ?? null,
          mrp: product.mrp ?? product.old_price ?? null,
          image: product.image,
          qty: 1,
          category_id: product.category_id,
          product_id: product.product_id ?? product.id,
          variantLabel: product.variantLabel ?? null,
          variantAttributes: product.variantAttributes ?? null,
          variant_id: product.variant_id ?? null,
          variant_sku: product.variant_sku ?? null,
        },
      ];
    });
  };

  /* ================= UPDATE QTY ================= */
  const updateQty = (idOrLineKey, type) => {
    setCart((prev) =>
      prev.map((item) =>
        lineKey(item) === String(idOrLineKey)
          ? {
              ...item,
              qty:
                type === "inc"
                  ? item.qty + 1
                  : Math.max(1, item.qty - 1),
            }
          : item,
      ),
    );
  };

  /* ================= REMOVE ================= */
  const removeFromCart = (idOrLineKey) => {
    setCart((prev) =>
      prev.filter((item) => lineKey(item) !== String(idOrLineKey)),
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);