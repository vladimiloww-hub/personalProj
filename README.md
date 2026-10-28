This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Online games (`/games`)

The two-player games at `/games` work on one phone and through challenge links
with no setup. Playing **online from two devices** needs a Supabase project:
the Next.js API keeps each room (and the secret words) in a Supabase table and
pings both players over Supabase Realtime after every move.

1. Create a project at [supabase.com](https://supabase.com) and run
   [`supabase/games.sql`](supabase/games.sql) in its SQL editor.
2. Add the project's keys to the Vercel environment (Settings → Environment
   Variables) — or connect the project with the Supabase integration on
   Vercel, which sets the same names:

   | Variable | Where to find it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Publishable / anon key |
   | `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) | Secret / service_role key — server only |

3. Redeploy so the public keys are built into the page.

Realtime uses public broadcast channels that only say "the room changed"; if
the project is set to private channels only, the pages still work by polling.

Without the keys, `npm run dev` keeps rooms in memory and the pages poll the
server every couple of seconds, so online play can be tried locally in two
browser windows. In production without them the "Онлайн" option says it isn't
set up yet.

