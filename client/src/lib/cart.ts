export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  selectedWeight?: string | null;
  variantPrice?: string | null;
  product: {
    id: number;
    name: string;
    price: string;
    weight: string;
    images: string[];
    gstRate: string;
  };
}

export function getItemPrice(item: CartItem): number {
  if (item.variantPrice && parseFloat(item.variantPrice) > 0) {
    return parseFloat(item.variantPrice);
  }
  return parseFloat(item.product.price);
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  total: number;
  itemCount: number;
}

export function calculateCartSummary(items: CartItem[], deliveryCharge: number = 0): CartSummary {
  const subtotal = items.reduce((sum, item) => {
    return sum + (getItemPrice(item) * item.quantity);
  }, 0);

  const gstAmount = items.reduce((sum, item) => {
    const itemTotal = getItemPrice(item) * item.quantity;
    const gstRate = parseFloat(item.product.gstRate) / 100;
    return sum + (itemTotal * gstRate);
  }, 0);

  const total = subtotal + gstAmount + deliveryCharge;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    subtotal,
    gstAmount,
    deliveryCharge,
    total,
    itemCount,
  };
}

export function formatPrice(price: number): string {
  return `₹${price.toFixed(2)}`;
}

export function getGSTBreakdown(items: CartItem[]): {
  cgst: number;
  sgst: number;
  igst: number;
} {
  const totalGST = items.reduce((sum, item) => {
    const itemTotal = getItemPrice(item) * item.quantity;
    const gstRate = parseFloat(item.product.gstRate) / 100;
    return sum + (itemTotal * gstRate);
  }, 0);

  // For intra-state transactions (within UP), GST is split into CGST and SGST
  // For inter-state transactions, it's IGST
  return {
    cgst: totalGST / 2,
    sgst: totalGST / 2,
    igst: 0, // Set to totalGST for inter-state
  };
}

export function validateCartForCheckout(items: CartItem[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Cart is empty');
  }

  items.forEach((item) => {
    if (item.quantity <= 0) {
      errors.push(`Invalid quantity for ${item.product.name}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
