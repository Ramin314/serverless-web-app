export async function handler(event) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': `https://${process.env.DOMAIN_NAME}`,
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      'message': `
        Hello, world! You've hit ${event.path}\n
        with context data
        ${JSON.stringify(event?.requestContext?.authorizer)}
      `,
    }),
  };
};
