# 1241 Electrical Inventory

Electrical-parts stockroom built with Next.js, Clerk, and Convex. Signed-in users share one inventory: add and edit supplies, manage categories, search by name/SKU/location/supplier, adjust quantities, and review a reorder list. The interface follows the incoming blue-and-gray stockroom implementation.

The header includes a persistent kiosk-mode toggle for shared tablets. Kiosk mode enlarges text and touch targets, reduces secondary information, makes receive/issue actions prominent, and moves new-supply creation to a secondary action. It can switch between grid and list layouts and offers compact, standard, and large item sizing. Quick and custom positive or fractional adjustments sit together directly on every item—there is no separate custom-adjustment screen. Stock changes update optimistically without replacing or reordering the table.

Supplies may include an optional HTTP/HTTPS order URL and one optional JPG, PNG, or WebP photo up to 8 MB. Photos appear in the inventory and kiosk views. Categories use a theme-matched palette by default and can be assigned a palette color or any valid six-digit custom hex color. Low stock is amber, out of stock is red, adding stock is green, and removing stock is red; labels remain present so meaning does not depend on color alone. All non-circular surfaces use the shared 6px corner radius.

Every signed-in account can view and change the shared stockroom. Restrict sign-up in Clerk to your intended team. Older private `items` and `stockMovements` tables and their owner-checked functions are preserved; the stockroom uses `inventoryItems` and `inventoryCategories`. Existing private data is not automatically copied into the shared inventory.

## Run locally

1. Run `npm ci`.
2. If `.env.local` does not already exist, copy `.env.example` to it and add your Clerk development publishable and secret keys. Activate the Convex integration in Clerk, or create a JWT template named `convex` with `{"aud":"convex"}`. Keep existing local configuration when it is already set up.
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
5. **Add your domain in Vercel** and complete the DNS setup shown there. Use the same domain that you configured for Clerk. Deploy, then check sign-in, adding/editing a supply, category management, and stock adjustments. A second authorized account should see the same shared stockroom. Signed-out visitors must not be able to query or change inventory.

Vercel can also create [preview sites](https://docs.convex.dev/production/hosting/vercel) for branches and pull requests. To use previews, set a **Convex preview deploy key** as `CONVEX_DEPLOY_KEY` in the Vercel Preview environment, use Clerk development keys there, and set a project default `CLERK_FRONTEND_API_URL` for Convex preview deployments. Preview deployments have separate inventory data. Until those values are set, preview builds may fail; production builds use the Production values above.

The public website shows a sign-in screen to visitors. Shared inventory queries and changes require a verified Clerk identity. Local and cloud deployments have separate data; deploying functions does not move your stock records.

## Checks

Run these before publishing:

```powershell
npm run typecheck
npm run lint
npm test
npm run test:ui
npm run build
```

`npm test` runs Convex functions in an isolated in-memory backend, including signed-out rejection, shared access, stock validation, category operations, and pagination beyond 500 records. `npm run test:ui` uses installed Google Chrome to test the real page and styles at desktop and phone widths with mocked Clerk/Convex hooks. The mocks live only in the test harness; the Next.js app always uses real authentication and database connections.

For a live smoke test at `http://localhost:3000`, sign in, create a disposable supply, edit it, change stock, search/filter it, and refresh to verify persistence. Rename its category and check the reorder view. Remove the test supply and category afterward. Check with a second authorized account and while signed out. Live Clerk sign-in requires your own account.

The page loads inventory in reactive pages of 100 until all records are available. Categories are limited to 100; category renames are atomic for up to 200 supplies and return an explicit error for larger groups.
