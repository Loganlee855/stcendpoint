const axios = require('axios');

const chatId = '-1002527332074';
const token = '7587542526:AAHyOc-bWJz_nrEX1m_EMmZ0WpZmhcSuEPQ';
const telegramApiUrl = `https://api.telegram.org/bot${token}/`;

async function sendError(error,message,route) {
  try {
    const stackTrace = error.stack.split('\n')[1];
    const filePath = stackTrace.match(/\((.*):\d+:\d+\)/);
    const fileName = filePath ? filePath[1].split('/').pop() : 'Unknown file';
    const line = stackTrace.match(/:(\d+):\d+/);
    const lineNumber = line ? line[1] : 'Unknown line';

    const formattedMessage = `
      <b>⚠️ ERROR <i>ENDPOINT</i> ALERT ⚠️</b>
      <pre><b>Date</b>: ${new Date().toLocaleString()}

<b>Message</b>: ${message}

<b>Error Messsage</b>: ${error.message}

<b>Route</b>: ${route}

<b>File Path</b>: ${fileName}

<b>Line</b>: ${lineNumber}</pre>
Please check boss....`;

    await axios.post(`${telegramApiUrl}sendMessage`, {
      chat_id: chatId,
      text: formattedMessage,
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function getCurrency(supportCurrency) {
  const currencies = supportCurrency.split(',');
  return currencies.includes('IDR') ? 'IDR' : currencies.includes('IDR2') ? 'IDR2' : null;
}

module.exports = { sendError, getCurrency };
