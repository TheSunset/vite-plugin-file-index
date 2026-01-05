import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      exports: "default",
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
    },
  ],
  external: [],
  plugins: [
    resolve(), // 解析 node_modules 中的模块
    commonjs(), // 将 CommonJS 转为 ES6
    terser(), // 代码压缩
  ],
};
