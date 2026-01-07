import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: [
    "@mathstream/shared",
    "@mathstream/db",
    "@mathstream/queue",
    "@mathstream/cache",
  ],
};

export default nextConfig;
