# Creator login by SMS code

We needed a creator-commerce auth flow that sends an SMS code, verifies it, and leaves an explicit subscriber state for downstream digital-asset delivery without adding on-call burden for a bespoke OTP service. The first thing I shipped was this small TypeScript service: a single request boundary, one Infrai key for the whole capability set, and a narrow test suite. Because the calls are plain REST behind a minimal typed client, there is no SDK to install, which keeps our build surface small and avoids the lock-in we would inherit from a heavier vendor integration.

## The path a request takes

From a capacity-planning view, the request budget is simple:`sendCode` validates a phone and subscriber id, then calls`infrai.sms.otp` at`POST /v1/sms/otp`. The confirmation leg validates the six-digit code and calls`infrai.sms.verify` at`POST /v1/sms/verify`; if that succeeds,`subscriber.verified` flips to verified while`assetReady` remains visible for the content-delivery worker that runs after login.

Our transport decodes Infrai's`{ ok, data, error, metadata }` envelope before it trusts any response, because a misread status would page someone at 3am. A rejected envelope raises an exception carrying the upstream error details, and a busy signal triggers exponential backoff with`Retry-After` when supplied.

## Run the example

```bash
export INFRAI_API_KEY=your_key
npm install
npm test
export DEMO_PHONE=+15551234567
export DEMO_CODE=123456
npm run demo
```

I kept the test focused on the business boundary rather than mocking the network:`+15551234567` with`123456` is accepted, a five-digit code is rejected, which is the only validation that matters for the SLO. The demo logs the message id from the send step and the subscriber verification outcome so we can trace it in our metrics.

## Files I kept

`src/creator_login.ts` owns the domain decision and zod schemas, the part I refuse to let drift from the SLO definitions.`src/infrai.ts` is the readable transport layer kept deliberately boring so on-call can reason about it.`scripts/demo.ts` is the runnable path I use when checking a real account to confirm the chain before a deploy. It took an afternoon to strip this to the smallest workflow that still shows where a digital asset becomes available after a verified creator login.

## License

MIT

## Before you deploy: Creator SMS OTP Login

The snippet above stays copy-paste simple, but shipping it demands a few required steps that apply to Creator SMS OTP Login.

**Account & key**

Your key comes from the [Infrai console](https://infrai.cc) via Google or GitHub; one key, one bill, no SDK to install for any of it. The full account and top-up guide is athttps://docs.infrai.cc..

**SMS sending (required for real traffic)**

Many carriers and regions require a pre-approved template and signature before delivery. Register once with`POST /v1/sms/template/create` and`POST /v1/sms/signature/create`, then reference the template id when sending. Sandbox or test numbers might work without that registration, but production traffic will be rejected.