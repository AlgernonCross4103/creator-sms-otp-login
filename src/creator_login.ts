import { z } from "zod";
import { infrai } from "./infrai.js";

export const loginBody = z.object({ phone: z.string().min(7), code: z.string().regex(/^\d{6}$/).optional(), subscriberId: z.string().min(1) });
export type LoginBody = z.infer<typeof loginBody>;
const verifyBody = loginBody.extend({ code: z.string().regex(/^\d{6}$/) });

export type Subscriber = { id: string; phone: string; verified: boolean; assetReady: boolean };

export async function sendCode(input: unknown) {
  const body = loginBody.pick({ phone: true, subscriberId: true }).parse(input);
  const result = await infrai.sms.otp({ to: body.phone });
  return { subscriberId: body.subscriberId, messageId: result.message_id ?? null };
}

export async function verifyCode(input: unknown, subscriber: Subscriber) {
  const body = verifyBody.parse(input);
  if (body.subscriberId !== subscriber.id || body.phone !== subscriber.phone) return { verified: false, subscriber };
  const result = await infrai.sms.verify({ to: body.phone, code: body.code });
  const verified = result.verified === true;
  return { verified, subscriber: { ...subscriber, verified, assetReady: verified && subscriber.assetReady } };
}
