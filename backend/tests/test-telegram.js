require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

console.log('Testing Telegram connection...');
console.log('Bot Token:', botToken ? botToken.substring(0, 20) + '...' : 'NOT SET');
console.log('Chat ID:', adminChatId || 'NOT SET');

if (!botToken || !adminChatId) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID is not set in backend/.env');
  process.exit(1);
}

// First test: check if bot token is valid
axios.get(`https://api.telegram.org/bot${botToken}/getMe`)
  .then(res => {
    console.log('\n✅ Bot token is valid!');
    console.log('   Bot username:', res.data.result.username);
    console.log('   Bot name:', res.data.result.first_name);

    // Second test: try to send a message
    return axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: adminChatId,
      text: '🔔 Test message from AURA Studio backend',
      parse_mode: 'HTML'
    });
  })
  .then(res => {
    if (res.data.ok) {
      console.log('\n✅ Test message sent successfully!');
      console.log('   Message ID:', res.data.result.message_id);
    }
  })
  .catch(err => {
    const data = err.response?.data;
    if (data?.error_code === 403) {
      console.error('\n❌ Bot can\'t message this chat.');
      console.error('   The user needs to message the bot FIRST on Telegram (send /start to @' + (err.config?.url?.match(/bot\d+:(.+)\//)?.[1] || 'the bot') + ')');
    } else if (data?.error_code === 400 && data?.description?.includes('chat not found')) {
      console.error('\n❌ Chat ID not found:', adminChatId);
      console.error('   Make sure the chat ID is correct.');
      console.error('   To get your chat ID, message @userinfobot on Telegram.');
    } else {
      console.error('\n❌ Error:', err.message);
      if (data) console.error('   Details:', JSON.stringify(data));
    }
  });
