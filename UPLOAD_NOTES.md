# RankBooster Upload Copy

This folder is a safe upload copy. It is separate from the main local working app.

Upload THIS folder to GitHub:
FORUPLOADS/GITHUB

Do not upload the parent project folder.

## What is inside

Frontend app:
- src/
- public/
- package.json
- package-lock.json

Static hosted test data:
- public/data/library.json
- public/data/courses/**/course.json
- public/data/courses/**/*.rbtest.json
- public/data/courses/**/*.rbtest.summary.json
- public/data/courses/**/*.rbtest.config.json
- public/data/courses/**/*.rbtest.images/*.json

Cloudflare Pages Functions:
- functions/library.js          -> reads static public/data/library.json
- functions/test.js             -> reads static full test JSON
- functions/question-images.js  -> reads static per-question image JSON
- functions/users.js            -> stores user profile in Turso
- functions/attempts.js         -> stores/list/deletes attempts in Turso
- functions/attempt.js          -> reads one attempt detail from Turso
- functions/notebooks.js        -> stores notebook data in Turso

Database SQL:
- database/schema.sql

## What is NOT included

Skipped on purpose:
- node_modules
- build
- .env
- ZIP files
- local users folder
- processed/deleted/errors folders
- local start/importer/share BAT files

## Cloudflare Pages settings

Build command:
npm run build

Build output directory:
build

Root directory:
/

## Cloudflare environment variables

Set these in Cloudflare Pages -> Settings -> Environment variables:

TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
JWT_SECRET=any_long_random_text

## Turso setup

Run database/schema.sql in Turso first.

## Important

For now, test JSON is hosted from GitHub/Cloudflare static files.
User data, pass data, attempts, and notebooks are designed to go to Turso.

Later, when test JSON/images become too large for GitHub, move them to Cloudflare R2.
