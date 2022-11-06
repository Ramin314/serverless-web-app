# AWS CDK Serverless Application

This app is written using the [AWS Cloud Development Kit](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-javascript.html) which provisions infrastructure using code.

It includes
- an API Gateway with Lambda integrations
- a static frontend hosted on S3 served through Cloudfront
- a connection to a PlanetScale database (much more cost-effective than RDS or DynamoDB), and
- social authentication using Google's Sign In Button.

Online examples other than this repo at the time of writing do not show you how to configure social login or non-AWS database connections in a serverless setup.

## Running the application

To start the application, run `docker-compose up`.

This will require the following environment variables to be configured in a `.env` file at the root of the repository:

```
AWS_ACCOUNT=<AWS_ACCOUNT>
AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
AWS_DEFAULT_REGION=<AWS_DEFAULT_REGION>
DOMAIN_NAME=<DOMAIN_NAME>
GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET>
DATABASE_URL=<DATABASE_URL>
DB_USER=<DB_USER>
DB_PASSWORD=<DB_PASSWORD>
DB_HOST=<DB_HOST>
DB_NAME=<DB_NAME>
```

You will need to:
1. Setup an AWS account
2. Acquire a domain name (via AWS Route53)
3. Setup a Google cloud account with client ID configured for the domain
4. Setup a PlanetScale account with a database

## Running tests

Tests can be run using `npm run test`

## Linting

Code can be linted and formatted wherever possible using `npm run lint`

## Database

To push database schema changes, run

`npx prisma db push`

## Purging state

To remove all artefacts of the application from your computer, run

`docker-compose down -v`
