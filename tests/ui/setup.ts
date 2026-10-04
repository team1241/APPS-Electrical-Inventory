import { createServer } from "vite";

export default async function setup() {
	const server = await createServer({ configFile: "tests/ui/vite.config.mts" });
	await server.listen();
	return async () => {
		await server.close();
	};
}
