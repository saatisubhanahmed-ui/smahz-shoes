/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // nodemailer is a Node-only package; keep it out of the server bundle
  serverExternalPackages: ["nodemailer"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
