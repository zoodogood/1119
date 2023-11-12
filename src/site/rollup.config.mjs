import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import livereload from "rollup-plugin-livereload";
import css from "rollup-plugin-css-only";
import nodePolyfills from "rollup-plugin-polyfill-node";

import replace from "@rollup/plugin-replace";
import replaces from "#site/enviroment/values.js";
import { execSync, spawn } from "child_process";

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    async writeBundle() {
      if (server) return;
      server = spawn("yarn", ["run", "site-watch", "--", "--dev"], {
        stdio: ["ignore", "inherit", "inherit"],
        shell: true,
      });

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    },
  };
}

export default {
  input: "./src/site/src/core/index.js",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "./static/build/svelte-bundle/bundle.js",
  },
  plugins: [
    execSync("yarn run createPagesExports") && false,

    replace({
      include: ["./src/site/src/enviroment/mod.js"],
      preventAssignment: true,
      values: replaces,
    }),

    nodePolyfills(),

    svelte({
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: "bundle.css" }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("../../static"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
