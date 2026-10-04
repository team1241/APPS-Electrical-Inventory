import type { ImgHTMLAttributes } from "react";
export default function Image({
	priority: _priority,
	unoptimized: _unoptimized,
	...props
}: ImgHTMLAttributes<HTMLImageElement> & {
	priority?: boolean;
	unoptimized?: boolean;
}) {
	// biome-ignore lint/performance/noImgElement: this test double intentionally renders a plain image.
	return <img alt={props.alt ?? ""} {...props} />;
}
