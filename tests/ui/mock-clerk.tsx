import type { ReactNode } from "react";
export function useAuth() {
	return { isLoaded: true, isSignedIn: !location.search.includes("signedout") };
}
export function UserButton() {
	return (
		<button type="button" aria-label="Account" className="user-avatar">
			T
		</button>
	);
}
export function SignInButton({ children }: { children: ReactNode }) {
	return children;
}
