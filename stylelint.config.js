/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-plugin-logical-css"],
  rules: {
    "plugin/use-logical-properties-and-values": [true, { severity: "warning" }],
    "plugin/use-logical-units": [true, { severity: "warning" }],
  },
};
