import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { fileURLToPath } from 'url';

import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
} from 'aws-cdk-lib';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class AppStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    /* S3 Buckets */

    const contentBucket = new s3.Bucket(this, 'content-bucket', {
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: [`https://${props.env.domainName}`],
          allowedHeaders: ['*'],
          exposedHeaders: ['Location'],
        },
      ],
      autoDeleteObjects: false,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const websiteBucket = new s3.Bucket(this, 'website-bucket', {
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    /* SSL Certificates */

    const cert = new Certificate(this, 'Certificate', {
      domainName: props.env.domainName,
      validation: CertificateValidation.fromDns(),
    });

    const apiCert = new Certificate(this, 'apiCertificate', {
      domainName: `api.${props.env.domainName}`,
      validation: CertificateValidation.fromDns(),
    });

    /* Cloudfront distribution */

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      domainNames: [props.env.domainName],
      certificate: cert,
      defaultBehavior: {
        origin: new S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        'assets/*': {
          origin: new S3Origin(contentBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    /* API Gateway */

    const api = new apigateway.RestApi(this, 'api', {
      description: 'app api gateway',
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'Cookie',
        ],
        allowMethods: [
          'OPTIONS',
          'GET',
          'POST',
          'PUT',
          'PATCH',
          'DELETE',
        ],
        allowCredentials: true,
        allowOrigins: [`https://${props.env.domainName}`],
      },
    });

    api.addGatewayResponse('unauthorised_response', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        'Access-Control-Allow-Origin': '\'*\'',
      },
    });

    api.addDomainName('domain_name', {
      domainName: `api.${props.env.domainName}`,
      certificate: apiCert,
    });

    /* Route 53 Records */

    const zone = route53.HostedZone.fromLookup(this, 'hostedZone', {
      domainName: props.env.domainName,
    });

    new route53.ARecord(this, 'AliasRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    new route53.ARecord(this, 'apiDNS', {
      zone: zone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
          new targets.ApiGateway(api),
      ),
    });

    /* Database Configurations */

    const dbConfig = {
      DATABASE_URL: props.env.databaseUrl,
      DB_USER: props.env.dbUser,
      DB_PASSWORD: props.env.dbPassword,
      DB_HOST: props.env.dbHost,
      DB_NAME: props.env.dbName,
    };

    const neo4jConfig = {
      NEO4J_URL: props.env.neo4jUrl,
      NEO4J_USER: props.env.neo4jUser,
      NEO4J_PASSWORD: props.env.neo4jPassword,
    };

    /* Authentication */

    const authLambda = new NodejsFunction(this, 'auth', {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      handler: 'handler',
      entry: path.join(__dirname, '/../functions/auth/auth.js'),
      environment: {
        RESOURCE_ARN: api.arnForExecuteApi(),
        ...dbConfig,
      },
    });

    const auth = new apigateway.RequestAuthorizer(this, 'authorizer', {
      handler: authLambda,
      identitySources: [apigateway.IdentitySource.header('Cookie')],
      resultsCacheTtl: Duration.minutes(0),
    });

    const loginLambda = new NodejsFunction(this, 'login', {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      handler: 'handler',
      entry: path.join(__dirname, '/../functions/auth/login.js'),
      environment: {
        GOOGLE_CLIENT_ID: props.env.googleClientId,
        DOMAIN_NAME: props.env.domainName,
        ...dbConfig,
      },
    });

    const logoutLambda = new NodejsFunction(this, 'logout', {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      handler: 'handler',
      entry: path.join(__dirname, '/../functions/auth/logout.js'),
      environment: {
        DOMAIN_NAME: props.env.domainName,
        ...dbConfig,
      },
    });

    /* Lambda Functions */

    const helloLambda = new NodejsFunction(this, 'hello', {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      handler: 'handler',
      entry: path.join(__dirname, '/../functions/hello.js'),
      environment: {
        DOMAIN_NAME: props.env.domainName,
      },
    });

    const getPresignedUrlLambda = new NodejsFunction(this, 'get-presigned-url', {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      handler: 'handler',
      entry: path.join(__dirname, '/../functions/get-presigned-url-s3.js'),
      environment: {
        BUCKET_NAME: contentBucket.bucketName,
        REGION: props.env.region,
        BASE_DIRECTORY: 'assets',
        MAXIMUM_FILE_SIZE: '1000000',
        EXPIRATION_TIME: '300',
        FILE_TYPES: 'image/',
      },
    });

    /* API Gateway Endpoints */

    const login = api.root.addResource('login');

    login.addMethod(
        'POST',
        new apigateway.LambdaIntegration(loginLambda),
    );

    const logout = api.root.addResource('logout');

    logout.addMethod(
        'GET',
        new apigateway.LambdaIntegration(logoutLambda),
    );

    const hello = api.root.addResource('hello');

    hello.addMethod(
        'GET',
        new apigateway.LambdaIntegration(helloLambda),
        { authorizer: auth },
    );

    const getPresignedUrl = api.root.addResource('get-presigned-url-s3');

    getPresignedUrl.addMethod(
        'GET',
        new apigateway.LambdaIntegration(getPresignedUrlLambda),
    );

    /* Permissions */

    contentBucket.grantPut(getPresignedUrlLambda);
    contentBucket.grantPutAcl(getPresignedUrlLambda);

    /* Outputs */

    this.contentBucketName = new CfnOutput(this, 'contentBucketName', {
      value: contentBucket.bucketName,
      exportName: 'contentBucketName',
    });

    this.websiteBucketName = new CfnOutput(this, 'websiteBucketName', {
      value: websiteBucket.bucketName,
      exportName: 'websiteBucketName',
    });

    this.apiUrl = new CfnOutput(this, 'apiUrl', {
      value: `api.${props.env.domainName}`,
      exportName: 'apiUrl',
    });

    this.distributionUrl = new CfnOutput(this, 'distributionUrl', {
      value: distribution.distributionDomainName,
      exportName: 'distributionUrl',
    });

    this.googleClientId = new CfnOutput(this, 'googleClientId', {
      value: props.env.googleClientId,
      exportName: 'googleClientId',
    });
  }
}
