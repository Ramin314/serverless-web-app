import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'crypto';

const mysql = require('serverless-mysql')({
  config: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    ssl: {},
  },
});

export async function handler(event, context, callback) {
  const body = new URLSearchParams(event.body);
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    console.log('Verifying ID token...');

    const ticket = await client.verifyIdToken({
      idToken: body.get('credential'),
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    payload['sub'];

    const sessionId = `${payload['email']}.${randomUUID()}`;

    console.log('Creating Session ID record...');

    await mysql.query(`
            INSERT INTO User (email, name, sessionId)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE sessionId = ?
            `,
    [payload['email'], payload['name'], sessionId, sessionId],
    );

    await mysql.end();

    console.log('Returning successful redirect response...');

    return {
      statusCode: 302,
      headers: {
        'Location': `https://${process.env.DOMAIN_NAME}`,
        'Set-Cookie': `session=${sessionId}; secure; httpOnly; sameSite=Lax; domain=${process.env.DOMAIN_NAME};`,
      },
    };
  } catch (error) {
    console.log('Returning unsuccessful redirect response...');

    return {
      statusCode: 302,
      headers: {
        'Location': `https://${process.env.DOMAIN_NAME}`,
        'Set-Cookie': `session=; Max-Age=0; path=/; domain=${process.env.DOMAIN_NAME};`,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
}
