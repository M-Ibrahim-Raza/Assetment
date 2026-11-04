/** @type {import('prettier').Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"], // keep last
  tailwindStylesheet: "./app/globals.css",
  tailwindFunctions: ["cn", "clsx", "cva"],
};

export default config;
