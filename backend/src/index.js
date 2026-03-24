require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Secure server running on port ${PORT}`);
});
