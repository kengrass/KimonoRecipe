import type { NextConfig } from "next";

/**
 * Next 16 の webpack dev は `devtool: false` にしたうえで
 * EvalSourceMapDevToolPlugin（中で eval を使う）を挿す。
 * その eval がこの環境では動かないため、プラグインだけ外す。
 */
function disableEvalSourceMaps(config: {
  plugins?: { constructor?: { name?: string } }[];
}) {
  config.plugins = (config.plugins ?? []).filter(
    (plugin) => plugin?.constructor?.name !== "EvalSourceMapDevToolPlugin",
  );
}

/**
 * Content-Security-Policy-Report-Only（強制はしない）。
 * 違反はブラウザコンソールに出る。壊さない段階導入の第一歩。
 * 本番 enforce に上げる前に、実害のないことを確認してから。
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://d2z0ysf6sthedw.cloudfront.net https://www.kimonorecipe.com",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** spike 試作 API（未設定なら rewrite なし） */
const SPIKE_API_ORIGIN = process.env.SPIKE_API_ORIGIN?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2z0ysf6sthedw.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "www.kimonorecipe.com",
      },
      ...(SPIKE_API_ORIGIN
        ? [
            {
              protocol: "http" as const,
              hostname: "127.0.0.1",
              port: "4010",
              pathname: "/media/**",
            },
            {
              protocol: "http" as const,
              hostname: "localhost",
              port: "4010",
              pathname: "/media/**",
            },
          ]
        : []),
    ],
  },
  async rewrites() {
    if (!SPIKE_API_ORIGIN) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${SPIKE_API_ORIGIN}/api/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${SPIKE_API_ORIGIN}/media/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: CSP_REPORT_ONLY,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/preview", destination: "/", permanent: false },
      { source: "/preview/:path*", destination: "/:path*", permanent: false },
    ];
  },
  turbopack: {},
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) disableEvalSourceMaps(config);
    if (dev) {
      // 退避コピー _archive を監視対象外にして EMFILE / .next 衝突を防ぐ
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/_archive/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
