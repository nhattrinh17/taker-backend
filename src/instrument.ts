// Import with `const Sentry = require("@sentry/node");` if you are using CJS
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: 'https://f5c99bae00d0a8ba55792b195ba068cb@o4507333428379648.ingest.us.sentry.io/4507333438996480',
  integrations: [nodeProfilingIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
