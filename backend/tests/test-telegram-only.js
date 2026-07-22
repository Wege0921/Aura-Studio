const { telegramService } = require('./src/services/telegramService');

async function testTelegramOnly() {
  try {
    console.log('Testing Telegram service...');
    
    const result = await telegramService.sendPaymentNotification({
      userName: 'Test User',
      userEmail: 'test@example.com',
      className: 'Test Class',
      classDate: 'May 5, 2026',
      classTime: '6:16 AM',
      paymentMethod: 'BANK_TRANSFER',
      amount: 500,
      receiptUrl: 'http://localhost:3000/uploads/test-receipt.pdf'
    });
    
    console.log('Telegram test result:', result);
  } catch (error) {
    console.error('Telegram test error:', error);
  }
}

testTelegramOnly();
