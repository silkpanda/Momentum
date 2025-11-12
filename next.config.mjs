// =========================================================
// silkpanda/momentum-web/next.config.mjs
// Next.js Configuration with API Proxy Rewrites
// =========================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Use rewrites to proxy API requests to the backend server
    // This is a development-only configuration
    async rewrites() {
        return [
            {
                // Source: All requests starting with /api/
                source: '/api/:path*',

                // Destination: Your backend API server
                // This forwards the request to http://localhost:3000/api/:path*
                destination: 'http://localhost:3000/api/:path*',
            },
        ];
    },
};

export default nextConfig;