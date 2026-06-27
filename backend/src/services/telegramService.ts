import axios from 'axios';

interface TelegramMessage {
  chat_id: string;
  text?: string;
  parse_mode?: 'HTML' | 'Markdown';
  photo?: string; // URL or file_id
  caption?: string;
}

class TelegramService {
  private botToken: string;
  private adminChatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
    
    if (!this.botToken || !this.adminChatId) {
      console.warn('Telegram credentials not configured. Telegram notifications will be disabled.');
    }
  }

  private get apiUrl(): string {
    return `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendTextMessage(message: string): Promise<boolean> {
    if (!this.botToken || !this.adminChatId) {
      console.warn('Telegram not configured, skipping message');
      return false;
    }

    try {
      const payload: TelegramMessage = {
        chat_id: this.adminChatId,
        text: message,
        parse_mode: 'HTML'
      };

      const response = await axios.post(`${this.apiUrl}/sendMessage`, payload);
      
      if (response.data.ok) {
        console.log('Telegram message sent successfully');
        return true;
      } else {
        console.error('Failed to send Telegram message:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendPhotoWithCaption(photoUrl: string, caption: string): Promise<boolean> {
    if (!this.botToken || !this.adminChatId) {
      console.warn('Telegram not configured, skipping photo message');
      return false;
    }

    try {
      const payload: TelegramMessage = {
        chat_id: this.adminChatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML'
      };

      const response = await axios.post(`${this.apiUrl}/sendPhoto`, payload);
      
      if (response.data.ok) {
        console.log('Telegram photo sent successfully');
        return true;
      } else {
        console.error('Failed to send Telegram photo:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Error sending Telegram photo:', error);
      return false;
    }
  }

  async sendPhotoFile(filePath: string, caption: string): Promise<boolean> {
    if (!this.botToken || !this.adminChatId) {
      console.warn('Telegram not configured, skipping photo message');
      return false;
    }

    try {
      const fs = require('fs');
      const FormData = require('form-data');
      
      if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return false;
      }

      const form = new FormData();
      form.append('chat_id', this.adminChatId);
      form.append('photo', fs.createReadStream(filePath));
      form.append('caption', caption);
      form.append('parse_mode', 'HTML');

      const response = await axios.post(`${this.apiUrl}/sendPhoto`, form, {
        headers: {
          ...form.getHeaders()
        }
      });
      
      if (response.data.ok) {
        console.log('Telegram photo file sent successfully');
        return true;
      } else {
        console.error('Failed to send Telegram photo file:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Error sending Telegram photo file:', error);
      return false;
    }
  }

  async sendDocumentWithCaption(filePath: string, caption: string): Promise<boolean> {
    if (!this.botToken || !this.adminChatId) {
      console.warn('Telegram not configured, skipping document message');
      return false;
    }

    try {
      const fs = require('fs');
      const FormData = require('form-data');
      
      if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return false;
      }

      const form = new FormData();
      form.append('chat_id', this.adminChatId);
      form.append('document', fs.createReadStream(filePath));
      form.append('caption', caption);
      form.append('parse_mode', 'HTML');

      const response = await axios.post(`${this.apiUrl}/sendDocument`, form, {
        headers: {
          ...form.getHeaders()
        }
      });
      
      if (response.data.ok) {
        console.log('Telegram document sent successfully');
        return true;
      } else {
        console.error('Failed to send Telegram document:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Error sending Telegram document:', error);
      return false;
    }
  }

  async sendPaymentNotification(bookingData: {
    userName: string;
    userEmail: string;
    className: string;
    classDate: string;
    classTime: string;
    paymentMethod: string;
    amount: number;
    receiptUrl: string;
  }): Promise<boolean> {
    const message = `
🧘‍♀️ <b>New Payment Received!</b>

📝 <b>Booking Details:</b>
👤 User: ${bookingData.userName} (${bookingData.userEmail})
🏷️ Class: ${bookingData.className}
📅 Date: ${bookingData.classDate}
⏰ Time: ${bookingData.classTime}
💰 Amount: ETB ${bookingData.amount.toLocaleString()}
💳 Payment Method: ${bookingData.paymentMethod.replace('_', ' ')}

📎 <b>Payment Receipt:</b> View attachment

⚠️ <b>Action Required:</b> Please verify and approve this payment in the admin dashboard.
    `.trim();

    // Send text message first
    const textSent = await this.sendTextMessage(message);
    
    // Then send the photo
    const photoSent = await this.sendPhotoWithCaption(bookingData.receiptUrl, '💳 Payment Receipt');
    
    return textSent && photoSent;
  }

  async sendBookingConfirmationNotification(bookingData: {
    userName: string;
    userEmail: string;
    className: string;
    classDate: string;
    classTime: string;
    paymentStatus: string;
  }): Promise<boolean> {
    const statusEmoji = bookingData.paymentStatus === 'PAID' ? '✅' : '⏳';
    const statusText = bookingData.paymentStatus === 'PAID' ? 'Paid' : 'Pending Payment';
    
    const message = `
${statusEmoji} <b>New Booking Confirmed!</b>

📝 <b>Booking Details:</b>
👤 User: ${bookingData.userName} (${bookingData.userEmail})
🏷️ Class: ${bookingData.className}
📅 Date: ${bookingData.classDate}
⏰ Time: ${bookingData.classTime}
💳 Payment Status: ${statusText}

🔗 <b>Manage Booking:</b> Check admin dashboard for details.
    `.trim();

    return await this.sendTextMessage(message);
  }

  async sendPackagePurchaseNotification(data: {
    userName: string;
    userEmail: string;
    packageName: string;
    sessionsCount: number;
    amount: number;
    paymentMethod: string;
    receiptUrl?: string;
  }): Promise<boolean> {
    const message = `
📦 <b>New Package Purchase!</b>

📝 <b>Purchase Details:</b>
👤 User: ${data.userName} (${data.userEmail})
📦 Package: ${data.packageName}
🔢 Sessions: ${data.sessionsCount}
💰 Amount: ETB ${data.amount.toLocaleString()}
💳 Payment Method: ${data.paymentMethod.replace('_', ' ')}

⚠️ <b>Action Required:</b> Please verify and approve this payment in the admin dashboard.
    `.trim();

    const textSent = await this.sendTextMessage(message);

    if (data.receiptUrl) {
      const photoSent = await this.sendPhotoWithCaption(data.receiptUrl, '💳 Payment Receipt');
      return textSent && photoSent;
    }

    return textSent;
  }

  async sendBookingCancellationNotification(bookingData: {
    userName: string;
    userEmail: string;
    className: string;
    classDate: string;
    classTime: string;
  }): Promise<boolean> {
    const message = `
❌ <b>Booking Cancelled!</b>

📝 <b>Cancelled Booking Details:</b>
👤 User: ${bookingData.userName} (${bookingData.userEmail})
🏷️ Class: ${bookingData.className}
📅 Date: ${bookingData.classDate}
⏰ Time: ${bookingData.classTime}

ℹ️ <b>Note:</b> The booking slot is now available for other users.
    `.trim();

    return await this.sendTextMessage(message);
  }

  async testConnection(): Promise<boolean> {
    const message = '🔔 <b>Telegram Bot Test</b>\n\nAURA Studio bot is working correctly!';
    return await this.sendTextMessage(message);
  }
}

export const telegramService = new TelegramService();
