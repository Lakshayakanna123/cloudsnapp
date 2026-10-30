import { Amplify } from 'aws-amplify';

// ─── Environment variable validation ──────────────────
const required = [
  'VITE_COGNITO_USER_POOL_ID',
  'VITE_COGNITO_CLIENT_ID',
  'VITE_COGNITO_REGION',
  'VITE_API_BASE_URL',
] as const;

const missing = required.filter((k) => !import.meta.env[k]);
if (missing.length > 0) {
  console.error(
    `[CloudSnap] Missing required environment variables: ${missing.join(', ')}\n` +
    `Copy frontend/.env.example to frontend/.env and fill in your values.`
  );
}

// ─── Amplify Configuration ────────────────────────────
export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
        signInWithRedirect: undefined,
        loginWith: {
          email: true,
          username: false,
        },
        userAttributes: {
          email: {
            required: true,
          },
        },
        passwordFormat: {
          minLength: 8,
          requireNumbers: true,
          requireLowercase: true,
          requireUppercase: true,
          requireSpecialCharacters: true,
        },
      },
    },
  });
}

export const awsConfig = {
  region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  cloudfrontDomain: import.meta.env.VITE_CLOUDFRONT_DOMAIN || '',
  cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};
