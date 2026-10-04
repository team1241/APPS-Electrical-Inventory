import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const path = (name: string) => fileURLToPath(new URL(name, import.meta.url));
export default defineConfig({
	resolve: {
		alias: [
			{ find: "@", replacement: path("../../src") },
			{ find: /^convex\/react$/, replacement: path("./mock-convex.ts") },
			{ find: /^@clerk\/nextjs$/, replacement: path("./mock-clerk.tsx") },
			{ find: /^next\/image$/, replacement: path("./mock-image.tsx") },
		],
	},
	esbuild: { jsx: "automatic" },
	server: { host: "127.0.0.1", port: 4173, strictPort: true },
});
