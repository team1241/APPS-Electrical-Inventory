"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function InventoryDialog({
	children,
	titleId,
	onClose,
	className = "",
}: {
	children: ReactNode;
	titleId: string;
	onClose: () => void;
	className?: string;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const dialog = ref.current;
		const trigger =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		dialog?.showModal();
		return () => {
			dialog?.close();
			trigger?.focus();
		};
	}, []);
	return (
		<dialog
			aria-labelledby={titleId}
			className={`item-modal ${className}`}
			onCancel={(event) => { event.preventDefault(); onClose(); }}
			ref={ref}
		>
			{children}
		</dialog>
	);
}
