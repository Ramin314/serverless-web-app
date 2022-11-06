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
  const session = event.headers?.cookie.split(';').find((e) => e.match(/session=.+/));
  const sessionId = session ? session.split('=')[1] : null;

  console.log('Setting database sessionId to null...');

  if (sessionId) {
    await mysql.query(
        'UPDATE User SET sessionId = NULL WHERE sessionId = ?',
        [sessionId],
    );
  }

  await mysql.end();

  console.log('Returning successful redirect response...');

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
