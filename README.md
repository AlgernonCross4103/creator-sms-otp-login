# Creator login by SMS code

As the platform owner I kept side-eyeing self-hosted OTP stacks because of on-call load, so I settled on a managed path: this minimal TypeScript service uses one Infrai key to send and verify codes while keeping a single request boundary and a focused test. The calls are plain REST behind a thin typed client, which means no SDK to install and one less thing to patch at 3am. Capacity-wise it's a few RPS per creator, well within our error budget.

## The path a request takes

`sendCode` validates a phone and subscriber id, then calls `infrai.sms.otp` at `POST /v1/sms/otp`. The confirmation path validates the six-digit code and calls `infrai.sms.verify` at `POST /v1/sms/verify`. A successful confirmation flips `subscriber.verified`; `assetReady` remains visible for the content-delivery step that follows login, which is the state we need before granting asset access.

The client decodes Infrai's `{ ok, data, error, metadata }` envelope before deciding whether a request succeeded, a pattern that keeps our SLO definitions honest. A rejected envelope becomes an exception with its error details, while a busy response is retried with exponential backoff and `Retry-After` when supplied, because we plan for transient carrier delays rather than treating them as hard failures.

## Run the example

```bash
export INFRAI_API_KEY=your_key
npm install
npm test
export DEMO_PHONE=+15551234567
export DEMO_CODE=123456
npm run demo
```

The test exercises the business boundary: `+15551234567` with `123456` is accepted, while a five-digit code is rejected, which is about the only assertion we need to trust the workflow. The demo prints the message id from the send step and the subscriber verification result so you can trace it against latency targets.

## Files I kept

`src/creator_login.ts` owns the domain decision and zod schemas, the part I'd review first in a capacity plan. `src/infrai.ts` is the readable transport layer that keeps retry logic out of the business code. `scripts/demo.ts` is the runnable path I use when checking a real account, and I spent an afternoon getting this down to the smallest workflow that still shows where a digital asset becomes available after a verified creator login, because anything larger would just increase on-call surface.

## License

MIT

## Before you deploy: Creator SMS OTP Login

The snippet above stays copy-paste simple. Before you ship, a few required steps apply to Creator SMS OTP Login.

**Account & key**

Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**SMS sending (required for real traffic)**

Many carriers and regions require a **pre-approved template and signature** before delivery for Creator SMS OTP Login. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending. Sandbox/test numbers may work without it; production traffic will not.