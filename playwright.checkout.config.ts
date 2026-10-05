import { CHECKOUT_SPECS, e2eConfig } from "./tests/e2e/e2e-config";

/** The checkout needs NEXT_PUBLIC_WEB_CHECKOUT=true at build time, so it gets its own build, port and folder. */
export default e2eConfig({
  port: 3101,
  distDir: ".next-e2e-checkout",
  extraEnv: { NEXT_PUBLIC_WEB_CHECKOUT: "true" },
  testMatch: CHECKOUT_SPECS,
});
