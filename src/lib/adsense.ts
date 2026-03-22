const adSenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const adSenseTopSlot = process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT;
const adSenseMidSlot = process.env.NEXT_PUBLIC_ADSENSE_MID_SLOT;

export function getAdSenseClientId() {
  return adSenseClientId;
}

export function hasAdSenseClientId() {
  return Boolean(adSenseClientId);
}

export function getAdSenseTopSlot() {
  return adSenseTopSlot;
}

export function getAdSenseMidSlot() {
  return adSenseMidSlot;
}
