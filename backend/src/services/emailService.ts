import nodemailer from 'nodemailer';

// Support both SMTP_* and EMAIL_* env conventions for backward compatibility
const SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_USER || 'noreply@aurastudio.com';
const FROM_NAME = process.env.FROM_NAME || 'AURA Studio';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP not configured. Emails will be logged to console.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const mailer = getTransporter();
  const from = `"${FROM_NAME}" <${FROM_EMAIL}>`;

  if (!mailer) {
    console.log(`[EMAIL] To: ${to}\nSubject: ${subject}\nBody:\n${text}`);
    return;
  }

  await mailer.sendMail({
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
    html,
  });
}

export async function sendContactNotification({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  await sendEmail({
    to: FROM_EMAIL,
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`,
  });
}

export async function sendBookingConfirmation({
  to,
  userName,
  className,
  classDate,
  classTime,
}: {
  to: string;
  userName: string;
  className: string;
  classDate: string;
  classTime: string;
}): Promise<void> {
  await sendEmail({
    to,
    subject: `Booking Confirmed — ${className}`,
    text: `Hi ${userName},\n\nYour booking for "${className}" on ${classDate} at ${classTime} is confirmed.\n\nSee you on the mat!\nAURA Studio`,
    html: `<p>Hi ${userName},</p><p>Your booking for <strong>${className}</strong> on ${classDate} at ${classTime} is confirmed.</p><p>See you on the mat!<br/>AURA Studio</p>`,
  });
}

export async function sendPaymentVerified({
  to,
  userName,
  amount,
}: {
  to: string;
  userName: string;
  amount: number;
}): Promise<void> {
  await sendEmail({
    to,
    subject: 'Payment Verified — AURA Studio',
    text: `Hi ${userName},\n\nYour payment of ETB ${amount.toLocaleString()} has been verified. Thank you!\n\nAURA Studio`,
    html: `<p>Hi ${userName},</p><p>Your payment of <strong>ETB ${amount.toLocaleString()}</strong> has been verified. Thank you!</p><p>AURA Studio</p>`,
  });
}

export async function sendPackageExpiryReminder({
  to,
  userName,
  packageName,
  daysLeft,
}: {
  to: string;
  userName: string;
  packageName: string;
  daysLeft: number;
}): Promise<void> {
  await sendEmail({
    to,
    subject: 'Package Expiry Reminder — AURA Studio',
    text: `Hi ${userName},\n\nYour ${packageName} package expires in ${daysLeft} day(s). Book your remaining sessions before it expires!\n\nAURA Studio`,
    html: `<p>Hi ${userName},</p><p>Your <strong>${packageName}</strong> package expires in <strong>${daysLeft} day(s)</strong>. Book your remaining sessions before it expires!</p><p>AURA Studio</p>`,
  });
}

// ============================================================
// SHOP ORDER EMAILS
// ============================================================

interface ShopOrderEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  orderUrl: string;
  items: { name: string; variantLabel?: string | null; quantity: number; lineTotal: number }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod?: string | null;
  shippingAddress?: { fullName: string; phone: string; region: string; city: string; address: string } | null;
}

function formatItemsList(items: ShopOrderEmailData['items']): string {
  return items
    .map((i) => `  • ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ''} × ${i.quantity} — ETB ${i.lineTotal.toLocaleString()}`)
    .join('\n');
}

function formatItemsHtml(items: ShopOrderEmailData['items']): string {
  return items
    .map((i) => `<tr><td style="padding:4px 0">${i.name}${i.variantLabel ? ` <em>(${i.variantLabel})</em>` : ''}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">ETB ${i.lineTotal.toLocaleString()}</td></tr>`)
    .join('');
}

export async function sendShopOrderConfirmation(data: ShopOrderEmailData): Promise<void> {
  const { to, customerName, orderNumber, orderUrl, items, subtotal, shippingCost, total, paymentMethod, shippingAddress } = data;
  const paymentLabel = paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'N/A';

  await sendEmail({
    to,
    subject: `Order Confirmed — ${orderNumber}`,
    text: `Hi ${customerName},\n\nThank you for your order! Here are the details:\n\nOrder: ${orderNumber}\nView online: ${orderUrl}\n\nItems:\n${formatItemsList(items)}\n\nSubtotal: ETB ${subtotal.toLocaleString()}\nShipping: ETB ${shippingCost.toLocaleString()}\nTotal: ETB ${total.toLocaleString()}\nPayment: ${paymentLabel}\n${shippingAddress ? `\nShip to:\n${shippingAddress.fullName}\n${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.region}\n${shippingAddress.phone}\n` : ''}\nWe'll process your order shortly.\n\nAURA Studio`,
    html: `<p>Hi ${customerName},</p><p>Thank you for your order! Here are the details:</p><p><strong>Order:</strong> ${orderNumber}<br/><a href="${orderUrl}">View your order online</a></p><table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr style="border-bottom:1px solid #ddd"><th style="text-align:left;padding:4px 0">Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead><tbody>${formatItemsHtml(items)}</tbody></table><p>Subtotal: ETB ${subtotal.toLocaleString()}<br/>Shipping: ETB ${shippingCost.toLocaleString()}<br/><strong>Total: ETB ${total.toLocaleString()}</strong><br/>Payment: ${paymentLabel}</p>${shippingAddress ? `<p><strong>Ship to:</strong><br/>${shippingAddress.fullName}<br/>${shippingAddress.address}<br/>${shippingAddress.city}, ${shippingAddress.region}<br/>${shippingAddress.phone}</p>` : ''}<p>We'll process your order shortly.</p><p>AURA Studio</p>`,
  });
}

export async function sendShopPaymentVerified({
  to,
  customerName,
  orderNumber,
  orderUrl,
  total,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderUrl: string;
  total: number;
}): Promise<void> {
  await sendEmail({
    to,
    subject: `Payment Verified — ${orderNumber}`,
    text: `Hi ${customerName},\n\nYour payment of ETB ${total.toLocaleString()} for order ${orderNumber} has been verified. Your order is now being processed.\n\nView your order: ${orderUrl}\n\nAURA Studio`,
    html: `<p>Hi ${customerName},</p><p>Your payment of <strong>ETB ${total.toLocaleString()}</strong> for order ${orderNumber} has been verified. Your order is now being processed.</p><p><a href="${orderUrl}">View your order</a></p><p>AURA Studio</p>`,
  });
}

export async function sendShopOrderShipped({
  to,
  customerName,
  orderNumber,
  orderUrl,
  carrier,
  trackingNumber,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderUrl: string;
  carrier?: string | null;
  trackingNumber?: string | null;
}): Promise<void> {
  const trackingInfo = trackingNumber ? `\nCarrier: ${carrier || 'N/A'}\nTracking: ${trackingNumber}` : '';
  const trackingHtml = trackingNumber ? `<p><strong>Carrier:</strong> ${carrier || 'N/A'}<br/><strong>Tracking:</strong> ${trackingNumber}</p>` : '';

  await sendEmail({
    to,
    subject: `Order Shipped — ${orderNumber}`,
    text: `Hi ${customerName},\n\nYour order ${orderNumber} has been shipped!${trackingInfo}\n\nView your order: ${orderUrl}\n\nAURA Studio`,
    html: `<p>Hi ${customerName},</p><p>Your order ${orderNumber} has been shipped!</p>${trackingHtml}<p><a href="${orderUrl}">View your order</a></p><p>AURA Studio</p>`,
  });
}

export async function sendShopOrderDelivered({
  to,
  customerName,
  orderNumber,
  orderUrl,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderUrl: string;
}): Promise<void> {
  await sendEmail({
    to,
    subject: `Order Delivered — ${orderNumber}`,
    text: `Hi ${customerName},\n\nYour order ${orderNumber} has been delivered. We hope you love your items!\n\nView your order: ${orderUrl}\n\nAURA Studio`,
    html: `<p>Hi ${customerName},</p><p>Your order ${orderNumber} has been delivered. We hope you love your items!</p><p><a href="${orderUrl}">View your order</a></p><p>AURA Studio</p>`,
  });
}

export async function sendShopAdminNewOrderAlert({
  orderNumber,
  customerName,
  total,
  paymentMethod,
  adminUrl,
}: {
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod?: string | null;
  adminUrl: string;
}): Promise<void> {
  const paymentLabel = paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'N/A';

  await sendEmail({
    to: FROM_EMAIL,
    subject: `New Shop Order — ${orderNumber}`,
    text: `A new shop order has been placed.\n\nOrder: ${orderNumber}\nCustomer: ${customerName}\nTotal: ETB ${total.toLocaleString()}\nPayment: ${paymentLabel}\n\nManage order: ${adminUrl}`,
    html: `<p>A new shop order has been placed.</p><p><strong>Order:</strong> ${orderNumber}<br/><strong>Customer:</strong> ${customerName}<br/><strong>Total:</strong> ETB ${total.toLocaleString()}<br/><strong>Payment:</strong> ${paymentLabel}</p><p><a href="${adminUrl}">Manage order</a></p>`,
  });
}
