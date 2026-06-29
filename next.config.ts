import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 디렉터리에 다른 lockfile 이 있어 워크스페이스 루트를 이 프로젝트로 고정.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
