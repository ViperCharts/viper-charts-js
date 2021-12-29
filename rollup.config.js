import typescript from "rollup-plugin-typescript2";
import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-import-css";

export default [
  // ES Modules
  {
    input: "src/viper.ts",
    output: {
      file: "dist/index.es.js",
      format: "es",
    },
    plugins: [typescript(), babel({ extensions: [".ts", ".jsx"] }), css()],
  },

  // UMD
  {
    input: "src/viper.ts",
    output: {
      file: "dist/index.umd.min.js",
      format: "umd",
      name: "viper-charts",
      indent: false,
    },
    plugins: [
      typescript(),
      babel({ extensions: [".ts", ".jsx"], exclude: "node_modules/**" }),
      terser(),
      css(),
    ],
  },
];
