require('dotenv').config();

const { validateRuntimeConfig } = require('../services/configCheck');

const { valid, errors } = validateRuntimeConfig(process.env);

if (!valid) {
  console.error('[ConfigCheck] Invalid runtime configuration:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.info('[ConfigCheck] Runtime configuration check passed.');
}
