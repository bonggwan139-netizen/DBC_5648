import coreWebVitalsConfig from "eslint-config-next/core-web-vitals.js";

const normalizedConfig = Array.isArray(coreWebVitalsConfig)
  ? coreWebVitalsConfig
  : Array.isArray(coreWebVitalsConfig?.default)
    ? coreWebVitalsConfig.default
    : [coreWebVitalsConfig?.default ?? coreWebVitalsConfig].filter(Boolean);

/** @type {import('eslint').Linter.Config[]} */
const config = normalizedConfig;

export default config;
