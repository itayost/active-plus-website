/**
 * Phase 1 sends buyers to the apps to register and pay. Plan 3 builds the web
 * checkout; flip NEXT_PUBLIC_WEB_CHECKOUT=true to turn it on once it ships.
 */
export const WEB_CHECKOUT_ENABLED = process.env.NEXT_PUBLIC_WEB_CHECKOUT === "true";
