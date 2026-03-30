'use strict';

const state = {
  checkoutAttempts: 0,
  checkoutFailures: 0,
  checkoutSuccesses: 0,
  lowStockEvents: 0,
  lastLowStockAlertAt: null,
};

const CHECKOUT_ALERT_MIN_SAMPLES = 10;
const CHECKOUT_ALERT_FAILURE_RATE = 0.2;
const LOW_STOCK_ALERT_THRESHOLD = 3;

const recordCheckoutAttempt = (success) => {
  state.checkoutAttempts += 1;
  if (success) {
    state.checkoutSuccesses += 1;
  } else {
    state.checkoutFailures += 1;
  }

  if (state.checkoutAttempts >= CHECKOUT_ALERT_MIN_SAMPLES) {
    const rate = state.checkoutFailures / state.checkoutAttempts;
    if (rate > CHECKOUT_ALERT_FAILURE_RATE) {
      console.warn(
        JSON.stringify({
          level: 'warn',
          event: 'checkout_failure_rate_high',
          checkoutAttempts: state.checkoutAttempts,
          checkoutFailures: state.checkoutFailures,
          failureRate: Number(rate.toFixed(3)),
        })
      );
    }
  }
};

const recordLowStockEvent = ({ productId, stockQuantity }) => {
  if (stockQuantity > LOW_STOCK_ALERT_THRESHOLD) return;

  state.lowStockEvents += 1;
  state.lastLowStockAlertAt = Math.floor(Date.now() / 1000);

  console.warn(
    JSON.stringify({
      level: 'warn',
      event: 'low_stock_threshold_crossed',
      productId,
      stockQuantity,
      threshold: LOW_STOCK_ALERT_THRESHOLD,
    })
  );
};

const getMetrics = () => ({
  ...state,
  checkoutFailureRate:
    state.checkoutAttempts === 0
      ? 0
      : Number((state.checkoutFailures / state.checkoutAttempts).toFixed(3)),
});

module.exports = {
  recordCheckoutAttempt,
  recordLowStockEvent,
  getMetrics,
};
