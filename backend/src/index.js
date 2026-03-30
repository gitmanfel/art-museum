require('dotenv').config();
const app = require('./app');
const { assertProductionSecurityConfig, logEmailDeliveryStartupStatus } = require('./services/startupStatus');

assertProductionSecurityConfig();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Secure server running on port ${PORT}`);
  logEmailDeliveryStartupStatus();
});
