import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { Configuration, OpenAIApi } from 'openai';
import { v4 } from 'uuid';


const OPEN_AI_API_KEY_SECRET_ID = 'open-ai-secret-api-key';

const secretsClient = new SecretsManagerClient({
  region: 'eu-central-1'
});
const s3Client = new S3Client({
  region: 'eu-central-1'
});

type CustomEvent = {
  imagePrompt: string;
}

const getApiKeyFromSecretManager = async () => {
  const secret = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: OPEN_AI_API_KEY_SECRET_ID,
    })
  );

  if (!secret.SecretString) {
    throw new Error('Failed to get secret');
  }

  return JSON.parse(secret.SecretString)['open-ai-secret-api-key'];
}

const putToS3 = (generatedImage: ArrayBuffer) => {
  return s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `images/${v4()}/image.png`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Body: generatedImage as any,
      ContentEncoding: 'base64',
      Metadata: {
        'Content-Type': 'image/png',
      },
    })
  );
}

export async function handler(event: CustomEvent) {
  const apiKey = await getApiKeyFromSecretManager();

  const openai = new OpenAIApi(
    new Configuration({
      apiKey,
    })
  );
  
  const response = await openai.createImage({
    prompt: event.imagePrompt,
    n: 1,
    size: '1024x1024',
  });

  const imageUrl = response.data.data[0].url;

  const generatedImageResponse = await fetch(imageUrl);
  const generatedImage = await generatedImageResponse.arrayBuffer();

  await putToS3(generatedImage);
}