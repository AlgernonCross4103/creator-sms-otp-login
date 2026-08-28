import { sendCode, verifyCode } from "../src/creator_login.js";

const phone = process.env.DEMO_PHONE;
const code = process.env.DEMO_CODE;
if (!phone || !code) throw new Error("DEMO_PHONE and DEMO_CODE are required");
const subscriber = { id: "sub_demo", phone, verified: false, assetReady: true };
const sent = await sendCode({ phone, subscriberId: subscriber.id });
const result = await verifyCode({ phone, code, subscriberId: subscriber.id }, subscriber);
console.log({ sent, result });
