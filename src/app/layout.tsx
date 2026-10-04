import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { RootProviders } from "@/components/providers/root-providers";

export const metadata: Metadata = {
	description:
		"Track electrical supplies, stock levels, and restocks in one place.",
	title: "1241 Electrical Inventory Tracker",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body suppressHydrationWarning>
				<ClerkProvider>
					<RootProviders>{children}</RootProviders>
				</ClerkProvider>
			</body>
		</html>
	);
}
