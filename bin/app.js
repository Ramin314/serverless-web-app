import { App } from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack.js';

const app = new App();

new AppStack(app, 'AppStack', {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_DEFAULT_REGION,
    domainName: process.env.DOMAIN_NAME,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    neo4jUrl: process.env.NEO4J_URL,
    neo4jUser: process.env.NEO4J_USER,
    neo4jPassword: process.env.NEO4J_PASSWORD,
  },
});
