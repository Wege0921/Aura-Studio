import nodemailer from 'nodemailer';

// Support both SMTP_* and EMAIL_* env conventions for backward compatibility
const SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_USER || 'noreply@aurastudio.com';
const FROM_NAME = process.env.FROM_NAME || 'AURA Studio';
// Internal notifications (contact forms, admin alerts) land here. ADMIN_EMAIL
// is the studio's support inbox.
const NOTIFY_EMAIL = process.env.ADMIN_EMAIL || FROM_EMAIL;

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

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   ATELIER EMAIL SHELL
   Inline CSS only — most email clients ignore <style> blocks.
   Palette mirrors the Atelier theme (jade accent on light canvas).
   ============================================================ */

function atelierEmail({ title, body }: { title?: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#e9ece9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e9ece9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#f6f8f6;border:1px solid #c9d0cb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="padding:26px 32px 22px;border-bottom:1px solid #dde2de;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.26em;color:#1a211e;font-weight:700;text-align:left;">AURA<span style="color:#2f6f5e;"> STUDIO</span></div>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 26px;">
              ${title ? `<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a211e;margin:0 0 8px;">${title}</h1>` : ''}
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 24px;border-top:1px solid #dde2de;">
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#626c66;margin:0;line-height:1.7;">AURA Yoga Studio &middot; Addis Ababa, Ethiopia</p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#626c66;margin:8px 0 0;line-height:1.7;">You are receiving this email because of a booking or purchase with AURA Studio.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function atelierParagraph(html: string): string {
  return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a211e;line-height:1.7;margin:0 0 14px;">${html}</p>`;
}

function atelierMuted(text: string): string {
  return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#626c66;margin:12px 0 0;line-height:1.6;">${text}</p>`;
}

function atelierButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:2px 0 20px;"><tr><td><a href="${href}" style="display:inline-block;background-color:#2f6f5e;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;padding:12px 22px;border-radius:6px;">${label}</a></td></tr></table>`;
}

function atelierKv(label: string, valueHtml: string): string {
  return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a544f;margin:0 0 10px;line-height:1.6;"><span style="display:block;color:#626c66;letter-spacing:0.06em;text-transform:uppercase;font-size:11px;font-weight:600;margin-bottom:2px;">${label}</span>${valueHtml}</p>`;
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
    to: NOTIFY_EMAIL,
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    html: atelierEmail({
      title: 'New contact form submission',
      body:
        atelierKv('Name', escapeHtml(name)) +
        atelierKv('Email', escapeHtml(email)) +
        atelierKv('Message', escapeHtml(message).replace(/\n/g, '<br/>')),
    }),
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

function paymentLabel(paymentMethod?: string | null): string {
  return paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'N/A';
}

function formatItemsList(items: ShopOrderEmailData['items']): string {
  return items
    .map((i) => `  • ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ''} × ${i.quantity} — ETB ${i.lineTotal.toLocaleString()}`)
    .join('\n');
}

function formatItemsHtml(items: ShopOrderEmailData['items']): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #dde2de;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a211e;">${escapeHtml(i.name)}${i.variantLabel ? ` <span style="color:#626c66;">(${escapeHtml(i.variantLabel)})</span>` : ''}</td><td style="padding:10px 0;border-bottom:1px solid #dde2de;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a544f;text-align:center;">${i.quantity}</td><td style="padding:10px 0;border-bottom:1px solid #dde2de;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a211e;text-align:right;">ETB ${i.lineTotal.toLocaleString()}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;border-collapse:collapse;">
  <tr><td style="padding:6px 0;border-bottom:1px solid #c9d0cb;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#626c66;font-weight:600;">Item</td><td style="padding:6px 0;border-bottom:1px solid #c9d0cb;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#626c66;font-weight:600;text-align:center;">Qty</td><td style="padding:6px 0;border-bottom:1px solid #c9d0cb;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#626c66;font-weight:600;text-align:right;">Price</td></tr>
  ${rows}
  <tr><td colspan="2" style="padding:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a544f;">Subtotal</td><td style="padding:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a211e;text-align:right;">ETB ${items.reduce((s, i) => s + i.lineTotal, 0).toLocaleString()}</td></tr>
</table>`;
}

export async function sendShopOrderConfirmation(data: ShopOrderEmailData): Promise<void> {
  const { to, customerName, orderNumber, orderUrl, items, subtotal, shippingCost, total, paymentMethod, shippingAddress } = data;
  const totalsHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr><td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a544f;">Subtotal</td><td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a211e;text-align:right;">ETB ${subtotal.toLocaleString()}</td></tr>
  <tr><td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a544f;">Shipping</td><td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a211e;text-align:right;">ETB ${shippingCost.toLocaleString()}</td></tr>
  <tr><td style="padding:8px 0 0;border-top:1px solid #c9d0cb;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1a211e;">Total</td><td style="padding:8px 0 0;border-top:1px solid #c9d0cb;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#2f6f5e;text-align:right;">ETB ${total.toLocaleString()}</td></tr>
</table>`;

  const shipTo = shippingAddress
    ? atelierKv('Ship to', `${escapeHtml(shippingAddress.fullName)}<br/>${escapeHtml(shippingAddress.address)}<br/>${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.region)}<br/>${escapeHtml(shippingAddress.phone)}`)
    : '';

  await sendEmail({
    to,
    subject: `Order Confirmed — ${orderNumber}`,
    text: `Hi ${customerName},\n\nThank you for your order! Here are the details:\n\nOrder: ${orderNumber}\nView online: ${orderUrl}\n\nItems:\n${formatItemsList(items)}\n\nSubtotal: ETB ${subtotal.toLocaleString()}\nShipping: ETB ${shippingCost.toLocaleString()}\nTotal: ETB ${total.toLocaleString()}\nPayment: ${paymentLabel(paymentMethod)}\n${shippingAddress ? `\nShip to:\n${shippingAddress.fullName}\n${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.region}\n${shippingAddress.phone}\n` : ''}\nWe'll process your order shortly.\n\nAURA Studio`,
    html: atelierEmail({
      title: 'Order confirmed',
      body:
        atelierParagraph(`Hi ${escapeHtml(customerName)}, thank you for your order with AURA Studio. Here are the details.`) +
        atelierKv('Order', escapeHtml(orderNumber)) +
        atelierButton(orderUrl, 'View your order') +
        formatItemsHtml(items) +
        totalsHtml +
        atelierKv('Payment method', escapeHtml(paymentLabel(paymentMethod))) +
        shipTo +
        atelierMuted("We'll process your order shortly."),
    }),
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
    html: atelierEmail({
      title: 'Payment verified',
      body:
        atelierParagraph(`Hi ${escapeHtml(customerName)}, your payment has been confirmed.`) +
        atelierKv('Order', escapeHtml(orderNumber)) +
        atelierKv('Amount paid', `ETB ${total.toLocaleString()}`) +
        atelierButton(orderUrl, 'View your order') +
        atelierMuted('Your order is now being processed.'),
    }),
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
  const trackingHtml = trackingNumber
    ? atelierKv('Carrier', escapeHtml(carrier || 'N/A')) + atelierKv('Tracking number', escapeHtml(trackingNumber))
    : '';

  await sendEmail({
    to,
    subject: `Order Shipped — ${orderNumber}`,
    text: `Hi ${customerName},\n\nYour order ${orderNumber} has been shipped!${trackingInfo}\n\nView your order: ${orderUrl}\n\nAURA Studio`,
    html: atelierEmail({
      title: 'Your order has shipped',
      body:
        atelierParagraph(`Hi ${escapeHtml(customerName)}, good news — your order is on the way.`) +
        atelierKv('Order', escapeHtml(orderNumber)) +
        trackingHtml +
        atelierButton(orderUrl, 'View your order'),
    }),
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
    html: atelierEmail({
      title: 'Your order has been delivered',
      body:
        atelierParagraph(`Hi ${escapeHtml(customerName)}, your order ${escapeHtml(orderNumber)} has been delivered. We hope you love your items!`) +
        atelierButton(orderUrl, 'View your order') +
        atelierMuted('Thank you for shopping with AURA Studio.'),
    }),
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
  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `New Shop Order — ${orderNumber}`,
    text: `A new shop order has been placed.\n\nOrder: ${orderNumber}\nCustomer: ${customerName}\nTotal: ETB ${total.toLocaleString()}\nPayment: ${paymentLabel(paymentMethod)}\n\nManage order: ${adminUrl}`,
    html: atelierEmail({
      title: 'New shop order',
      body:
        atelierParagraph('A new shop order has been placed.') +
        atelierKv('Order', escapeHtml(orderNumber)) +
        atelierKv('Customer', escapeHtml(customerName)) +
        atelierKv('Total', `ETB ${total.toLocaleString()}`) +
        atelierKv('Payment method', escapeHtml(paymentLabel(paymentMethod))) +
        atelierButton(adminUrl, 'Manage order'),
    }),
  });
}