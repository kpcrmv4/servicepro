import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ==========================================================================
     IMAGE CONFIGURATION
     ==========================================================================
     เพิ่ม domain ของ Supabase Storage เพื่อให้ next/image โหลดรูปจาก Supabase ได้
     ========================================================================== */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
