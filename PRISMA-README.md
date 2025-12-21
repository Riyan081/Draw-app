Pinned Prisma CLI to v6 (6.19.1)

Why: Running `npx prisma` at the repository root can fetch Prisma v7 from the registry, which changes schema rules (e.g. removing `datasource url`) and leads to confusing warnings.

How to use Prisma in this workspace (safe):

- Use the workspace CLI with `pnpm exec prisma ...` so it resolves the pinned v6 binary:

  pnpm exec prisma --version
  pnpm exec prisma migrate status

- Generate the client for the DB package (preferred):

  pnpm --filter @repo/db run generate

- Shortcut scripts from the workspace root:

  pnpm run prisma:version    # show the pinned prisma version
  pnpm run prisma:generate   # generate client for @repo/db

If you want to upgrade to Prisma 7 later, update dependencies intentionally and follow Prisma's migration guide.