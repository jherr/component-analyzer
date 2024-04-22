This is an example AI application that uses [Inngest](https://www.inngest.com/) to choreograph the long running AI jobs.

## Getting Started

Follow these steps to get started with the project:

1. Install the dependencies:

```bash
pnpm install
```

2. Setup your environment variables:

```bash
cp .env.example .env.development.local
```

Then, open the `.env.local` file and fill in the required environment variables.

2. Setup the local database by running the following command in the root directory of the project:

```bash
sqlite3 local.db < src/db/setup.sql
```

3. Run Inngest locally in another terminal window:

```bash
npx inngest-cli@latest dev
```

And open the [Inngest dashboard](http://127.0.0.1:8288/stream).

4. First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
