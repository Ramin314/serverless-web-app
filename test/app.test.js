const cdk = require('aws-cdk-lib');
const { Template } = require('aws-cdk-lib/assertions');
const App = require('../lib/app-stack');

test('API Gateway Created', () => {
  const app = new cdk.App();
  const stack = new App.AppStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::ApiGateway::RestApi', {
    VisibilityTimeout: 300
  });
});
