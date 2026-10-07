import { Order, CafeSettings, InventoryItem, SpecialOffer } from '../types/cafe';

/**
 * Sanitizes phone number to international WhatsApp format (digits only, no spaces or +)
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // If user entered 10 digits (e.g. Indian mobile starting with 9/8/7), default prepend 91 if not present
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Generates formatted WhatsApp Bill Message
 */
export function generateWhatsAppBillText(order: Order, settings: CafeSettings): string {
  const currency = settings.currencySymbol || '₹';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isBday = order.customer.isBirthdayToday;

  let message = `☕ *${settings.cafeName.toUpperCase()}* ☕\n`;
  message += `${settings.tagline}\n`;
  message += `📍 ${settings.address}\n`;
  if (settings.gstNumber) message += `GSTIN: ${settings.gstNumber}\n`;
  message += `--------------------------------\n`;
  message += `🧾 *TAX INVOICE / DIGITAL RECEIPT*\n`;
  message += `Order: *${order.orderNumber}*  |  *Table ${order.tableNumber}*\n`;
  message += `Date: ${orderDate} at ${orderTime}\n`;
  message += `Guest: *${order.customer.name}*\n`;

  if (isBday) {
    message += `🎂 *HAPPY BIRTHDAY!* 🥳 Enjoy your birthday cafe perks!\n`;
  }

  message += `--------------------------------\n`;
  message += `*ITEMS ORDERED:*\n`;

  order.items.forEach((item, index) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    message += `${index + 1}. ${item.name}\n`;
    message += `   ${item.quantity} x ${currency}${item.price} = *${currency}${itemTotal}*\n`;
    if (item.customization && (item.customization.milk || item.customization.sweetness || item.customization.notes)) {
      const details = [
        item.customization.milk,
        item.customization.sweetness,
        item.customization.notes
      ].filter(Boolean).join(', ');
      message += `   _(Note: ${details})_\n`;
    }
  });

  message += `--------------------------------\n`;
  message += `Subtotal: ${currency}${order.subtotal.toFixed(2)}\n`;

  if (order.discountAmount > 0) {
    message += `Discount (${order.discountPercentage}%${order.discountReason ? ' - ' + order.discountReason : ''}): -${currency}${order.discountAmount.toFixed(2)}\n`;
  }

  if (order.taxAmount > 0) {
    message += `Taxes (${order.taxPercentage}% GST): ${currency}${order.taxAmount.toFixed(2)}\n`;
  }

  if (order.serviceChargeAmount > 0) {
    message += `Service Charge (${order.serviceChargePercentage}%): ${currency}${order.serviceChargeAmount.toFixed(2)}\n`;
  }

  message += `--------------------------------\n`;
  message += `💰 *TOTAL AMOUNT: ${currency}${order.total.toFixed(2)}*\n`;
  message += `Payment Status: *${order.paymentStatus === 'paid' ? 'PAID ✅' : 'PENDING ⏳'}*`;
  if (order.paymentMethod) {
    message += ` (${order.paymentMethod.toUpperCase()})`;
  }
  message += `\n--------------------------------\n`;
  message += `Thank you for visiting ${settings.cafeName}! ❤️\n`;
  message += `Free high-speed WiFi: CafeGuest / Pass: freshbeans\n`;
  message += `Follow us on Instagram for daily specials & acoustic jams! 🎶`;

  return message;
}

/**
 * Creates wa.me link for sending bill
 */
export function getWhatsAppBillLink(order: Order, settings: CafeSettings): string {
  const phone = sanitizeWhatsAppPhone(order.customer.phone);
  const text = generateWhatsAppBillText(order, settings);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates customer order confirmation WhatsApp message
 */
export function generateCustomerOrderSummary(order: Order, settings: CafeSettings): string {
  const currency = settings.currencySymbol || '₹';
  let message = `🛎️ *ORDER CONFIRMED - ${settings.cafeName}*\n`;
  message += `Order: *${order.orderNumber}*  |  *Table ${order.tableNumber}*\n`;
  message += `Hello ${order.customer.name}, your order has been received by our kitchen & barista!\n\n`;
  message += `*Items:*\n`;
  order.items.forEach(item => {
    message += `• ${item.quantity}x ${item.name} (${currency}${item.price * item.quantity})\n`;
  });
  message += `\nEstimated prep time: ~8-12 minutes.\n`;
  message += `Total: *${currency}${order.total.toFixed(2)}*\n\n`;
  message += `Sit back and relax, your fresh order is brewing! ☕`;
  return message;
}

/**
 * WhatsApp message for Inventory Supplier Reorder
 */
export function generateSupplierReorderText(item: InventoryItem, reorderQty: number, settings: CafeSettings): string {
  let message = `📦 *PURCHASE REORDER - ${settings.cafeName}*\n`;
  message += `Hi ${item.supplierName || 'Supplier'},\n\n`;
  message += `We would like to place an urgent restock order for:\n`;
  message += `• Item: *${item.name}*\n`;
  message += `• Quantity Needed: *${reorderQty} ${item.unit}*\n`;
  message += `• Delivery Address: ${settings.address}\n\n`;
  message += `Please confirm availability & delivery ETA. Thank you!\n`;
  message += `- ${settings.cafeName} Purchasing Team`;
  return message;
}

export function getSupplierWhatsAppLink(item: InventoryItem, reorderQty: number, settings: CafeSettings): string {
  const phone = sanitizeWhatsAppPhone(item.supplierPhone || '');
  const text = generateSupplierReorderText(item, reorderQty, settings);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * WhatsApp message for Marketing / Offers Broadcast
 */
export function generateWhatsAppOfferBroadcastText(
  offer: SpecialOffer,
  settings: CafeSettings,
  customerName?: string
): string {
  const currency = settings.currencySymbol || '₹';
  const greeting = customerName ? `Hello ${customerName}` : `Hello Coffee Lover`;

  let message = `☕ *${settings.cafeName.toUpperCase()} EXCLUSIVE* ✨\n\n`;
  message += `${greeting}, we've crafted something special for you today!\n\n`;
  message += `🎉 *[${offer.badgeText.toUpperCase()}]*\n`;
  message += `🌟 *${offer.title}*\n`;
  if (offer.tagline) {
    message += `_${offer.tagline}_\n\n`;
  } else {
    message += `\n`;
  }
  message += `${offer.description}\n\n`;

  if (offer.originalPrice && offer.originalPrice > offer.offerPrice) {
    const savings = offer.originalPrice - offer.offerPrice;
    message += `💰 Regular: ~${currency}${offer.originalPrice}~  ➡️  *Special Offer: ${currency}${offer.offerPrice}* (Save ${currency}${savings}!)\n`;
  } else if (offer.offerPrice > 0) {
    message += `💰 *Special Offer Price: ${currency}${offer.offerPrice}*\n`;
  }

  if (offer.validUntil) {
    message += `📅 *Validity:* ${offer.validUntil}\n`;
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://brewpulse.cafe';
  message += `\n📲 *Browse Menu & Reserve Table:* ${appUrl}?table=1\n`;
  message += `📍 ${settings.address}\n\n`;
  message += `Show this WhatsApp message to our barista or mention code *${offer.badgeText.replace(/[^A-Z0-9]/gi, '')}* to redeem! ❤️\n`;
  message += `_Reply STOP to opt out of promotional messages._`;

  return message;
}

export function getWhatsAppOfferBroadcastLink(
  offer: SpecialOffer,
  phone: string,
  settings: CafeSettings,
  customerName?: string
): string {
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  const text = generateWhatsAppOfferBroadcastText(offer, settings, customerName);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
