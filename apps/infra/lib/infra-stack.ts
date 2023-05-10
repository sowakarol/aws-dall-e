import * as cdk from 'aws-cdk-lib';
import { Duration, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'node:path';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

const OPEN_AI_API_KEY_SECRET_ID = 'open-ai-secret-api-key';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const openAIAPIKEY = Secret.fromSecretNameV2(this, OPEN_AI_API_KEY_SECRET_ID, 'open-ai-secret-api-key');

    const imageBucket = new Bucket(this, 'Image-Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

     const generateImageFunc: NodejsFunction = new NodejsFunction(this, 'lambda-image-generator', {
      memorySize: 1024,
      timeout: Duration.minutes(5),
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../image-generator', 'index.ts'),
      environment: {
        BUCKET_NAME: imageBucket.bucketName,
      },
    });

    imageBucket.grantReadWrite(generateImageFunc);
    openAIAPIKEY.grantRead(generateImageFunc);
  }
}
