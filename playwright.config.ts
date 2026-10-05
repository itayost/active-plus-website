import { CHECKOUT_SPECS, e2eConfig } from "./tests/e2e/e2e-config";

/** The default build: the web checkout off, as in production today. */
export default e2eConfig({ port: 3100, distDir: ".next-e2e", testIgnore: CHECKOUT_SPECS });
