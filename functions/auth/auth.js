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

  if (sessionId) {
    const results = await mysql.query(
        'SELECT * FROM User WHERE sessionId = ? LIMIT 1',
        [sessionId],
    );

    await mysql.end();

    if (results && results.length) {
      return {
        'principalId': sessionId,
        'policyDocument': {
          'Version': '2012-10-17',
          'Statement': [
            {
              'Action': 'execute-api:Invoke',
              'Effect': 'Allow',
              'Resource': process.env.RESOURCE_ARN,
            },
          ],
        },
        'context': {
          'user': `${JSON.stringify(results[0])}`,
        },
      };
    } else {
      throw new Error('Unauthorized');
    }
  } else {
    throw new Error('Unauthorized');
  }
}
