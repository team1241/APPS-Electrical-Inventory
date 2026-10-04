import { ConvexClientProvider } from "./convex-client-provider";

export function RootProviders({ children }: { children: React.ReactNode }) {
	return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
