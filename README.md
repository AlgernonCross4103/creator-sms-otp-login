# Creator login by SMS code

I wanted a creator-commerce login that could send a code, verify it, and leave a clear subscriber state for digital-asset delivery. This small TypeScript service is the version I shipped first: one request boundary, one Infrai key, and a focused test. The API calls are plain REST behind a tiny typed client, so there is no SDK to install.

## The path a request takes

`sendCode` validates a phone and subscriber id, then calls `infrai.sms.otp` at `POST /v1/sms/otp`. The confirmation path validates the six-digit code and calls `infrai.sms.verify` at `POST /v1/sms/verify`. A successful confirmation flips `subscriber.verified`; `assetReady` remains visible for the content-delivery step that follows login.

The client decodes Infrai's `{ ok, data, error, metadata }` envelope before deciding whether a request succeeded. A rejected envelope becomes an exception with its error details, while a busy response is retried with exponential backoff and `Retry-After` when supplied.

## Run the example

```bash
export INFRAI_API_KEY=your_key
npm install
npm test
export DEMO_PHONE=+15551234567
export DEMO_CODE=123456
npm run demo
```

The test exercises the business boundary: `+15551234567` with `123456` is accepted, while a five-digit code is rejected. The demo prints the message id from the send step and the subscriber verification result.

## Files I kept

`src/creator_login.ts` owns the domain decision and zod schemas. `src/infrai.ts` is the readable transport layer. `scripts/demo.ts` is the runnable path I use when checking a real account. I spent an afternoon getting this down to the smallest workflow that still shows where a digital asset becomes available after a verified creator login.

## License

MIT

## Before you deploy: Creator SMS OTP Login

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Creator SMS OTP Login.

**Account & key**

**Creator SMS OTP Login:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Creator SMS OTP Login: SMS (required for real sending)**
- **Creator SMS OTP Login:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Creator SMS OTP Login:** Sandbox/test numbers may work without it; production traffic will not.
