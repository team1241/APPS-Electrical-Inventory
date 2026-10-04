"use client";

import { Component, type ReactNode } from "react";

export class InventoryErrorBoundary extends Component<
	{ children: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		if (this.state.failed) {
			return (
				<main className="access-screen">
					<section className="access-card" role="alert">
						<h1>Stockroom unavailable</h1>
						<p>
							We could not load your inventory. Check your connection and try
							again.
						</p>
						<button
							className="primary-button"
							onClick={() => window.location.reload()}
							type="button"
						>
							Try again
						</button>
					</section>
				</main>
			);
		}
		return this.props.children;
	}
}
