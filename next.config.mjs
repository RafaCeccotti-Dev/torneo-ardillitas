/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/acreditar/:token",
        destination: "/plantel/:token",
        permanent: false,
      },
      {
        source: "/partidos/femenino/2015",
        destination: "/partidos/femenino/2011",
        permanent: true,
      },
      {
        source: "/tabla/femenino/2015",
        destination: "/tabla/femenino/2011",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/acreditar/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate, max-age=0" },
        ],
      },
      {
        source: "/plantel/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate, max-age=0" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
