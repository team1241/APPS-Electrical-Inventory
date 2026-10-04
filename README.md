# Volt Inventory

Electrical-parts inventory built with Next.js, Clerk, and Convex. Signed-in users can add parts and photos, search by category, name, or SKU, see low-stock items, and adjust stock by one or by a custom amount. Each account has its own private inventory.

## Run locally

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and add your Clerk development publishable and secret keys. Activate the Convex integration in Clerk, or create a JWT template named `convex` with `{"aud":"convex"}`.
3. Run `npx convex dev`. This starts the local Convex backend and writes its URL to `.env.local`. Keep this terminal open.
4. In another terminal, set `CLERK_FRONTEND_API_URL` on that Convex deployment to the Clerk Frontend API URL, including `https://` and without a trailing slash. For example: `npx convex env set CLERK_FRONTEND_API_URL https://your-instance.clerk.accounts.dev`. Then stop and restart `npx convex dev` to sync the auth configuration. This setting belongs to Convex, not `.env.local`.
5. In a second terminal, run `npm run dev` and open `http://localhost:3000`.

The local Convex backend at `127.0.0.1` is for development. It cannot serve a public website, and its data is not automatically copied to a cloud deployment.

## Publish from GitHub with Vercel

This repository includes [vercel.json](vercel.json). Its build command deploys the Convex functions, gives the Next.js build the matching cloud Convex URL, and publishes the website. Once you connect the GitHub repository to Vercel, pushes to the production branch trigger deployments automatically; GitHub Actions are optional.

1. **Set up Clerk production.** [Create a production instance](https://clerk.com/docs/guides/development/deployment/production), connect a domain you control (for example, `inventory.example.com`), and [activate its Convex integration](https://clerk.com/docs/guides/development/integrations/databases/convex). Record the production publishable key, secret key, and Frontend API URL. Clerk production keys require your own domain; the default `*.vercel.app` address is suitable only for development or preview keys.
2. **Set up cloud Convex.** Create or link a Convex cloud project and use its production deployment. In that production deployment's environment settings, set `CLERK_FRONTEND_API_URL` to the *production* Clerk Frontend API URL. [Generate a production deploy key](https://docs.convex.dev/production/hosting/vercel) with `deployment:deploy` permission. Do not use the anonymous local deployment URL or key.
3. **Import GitHub into Vercel.** Import `team1241/APPS-Electrical-Inventory` at [vercel.com/new](https://vercel.com/new). Keep the root directory at the repository root and the detected framework as Next.js. The build command comes from `vercel.json`.
4. **Set Vercel Production environment variables:**

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk production publishable key (`pk_live_...`) |
   | `CLERK_SECRET_KEY` | Clerk production secret key (`sk_live_...`) |
   | `CONVEX_DEPLOY_KEY` | Convex production deploy key |

   Do not add `NEXT_PUBLIC_CONVEX_URL` in Vercel Production: the Convex build command supplies the correct production URL. Do not commit any key or `.env.local` file.
5. **Add your domain in Vercel** and complete the DNS setup shown there. Use the same domain that you configured for Clerk. Deploy, then check sign-in, adding an item, a photo, and stock adjustments. Sign in with a second account to confirm it cannot see the first account's items.

Vercel can also create [preview sites](https://docs.convex.dev/production/hosting/vercel) for branches and pull requests. To use previews, set a **Convex preview deploy key** as `CONVEX_DEPLOY_KEY` in the Vercel Preview environment, use Clerk development keys there, and set a project default `CLERK_FRONTEND_API_URL` for Convex preview deployments. Preview deployments have separate inventory data. Until those values are set, preview builds may fail; production builds use the Production values above.

The public website shows a sign-in screen to visitors. Inventory queries and changes require a verified Clerk identity, and Convex scopes every item query and stock change to that identity. Accounts do not share one inventory. If you need existing local items in the hosted deployment, export and import that data separately and map each item's owner to a production Clerk account.

## Checks

Run `npm run build`, `npm run lint`, `npx tsc --noEmit`, and `npx tsc -p convex/tsconfig.json --noEmit` before publishing.
