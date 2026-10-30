import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { AuthContext } from '../types';

/**
 * Extracts the authenticated user's identity from the verified JWT authorizer context.
 * NEVER use userId from request body/query — always use the JWT claims.
 */
export function getAuthContext(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): AuthContext {
  const claims = event.requestContext.authorizer?.jwt?.claims;

  if (!claims) {
    throw new AuthorizationError('No authorization context found');
  }

  // Cognito JWT claims
  const userId = claims['sub'] as string;
  const email = (claims['email'] as string) || '';
  const username = (claims['cognito:username'] as string) || userId;

  if (!userId) {
    throw new AuthorizationError('Invalid token: missing sub claim');
  }

  return { userId, email, username };
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
