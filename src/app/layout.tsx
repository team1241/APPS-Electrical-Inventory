import type { Metadata } from "next";
import {
	ClerkProvider,
	Show,
	SignInButton,
	SignUpButton,
	UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { RootProviders } from "@/components/providers/root-providers";

export const metadata: Metadata = {
	description:
		"Track electrical parts, stock levels, and locations in one workspace.",
	icons: { icon: "/icon.svg" },
	title: "Volt Inventory",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<ClerkProvider>
					<header className="auth-header">
						<Show when="signed-out">
							<SignInButton mode="modal">
								<button className="auth-sign-in" type="button">
									Sign in
								</button>
							</SignInButton>
							<SignUpButton mode="modal">
								<button className="auth-sign-up" type="button">
									Sign up
								</button>
							</SignUpButton>
						</Show>
						<Show when="signed-in">
							<UserButton />
						</Show>
					</header>
					<RootProviders>{children}</RootProviders>
				</ClerkProvider>
			</body>
		</html>
	);
}
