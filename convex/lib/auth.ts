import type { MutationCtx, QueryCtx } from "../_generated/server";

/** The incoming stockroom is shared by authenticated members. */
export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Sign in to access the stockroom.");
	return identity;
}
