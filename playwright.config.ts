import { defineConfig } from "@playwright/test";
export default defineConfig({
	testDir: "./tests/ui",
	testMatch: "**/*.spec.ts",
	fullyParallel: true,
	workers: 4,
	globalSetup: "./tests/ui/setup.ts",
	use: {
		baseURL: "http://127.0.0.1:4173",
		channel: "chrome",
		screenshot: "only-on-failure",
	},
	projects: [
		{ name: "tablet", use: { viewport: { width: 1024, height: 768 }, hasTouch: true } },
		{ name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
		{
			name: "mobile",
			use: {
				viewport: { width: 390, height: 844 },
				isMobile: true,
				hasTouch: true,
			},
		},
	],
});
