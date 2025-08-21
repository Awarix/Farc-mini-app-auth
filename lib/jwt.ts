import { createClient, Errors as QuickAuthErrors } from '@farcaster/quick-auth';
import prisma from './prisma';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

const quickAuthClient = createClient();
const neynarApiKey = process.env.NEYNAR_API_KEY;

function getAppDomain(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.warn('NEXT_PUBLIC_APP_URL is not set. JWT domain verification might be insecure.');
    return 'localhost'; 
  }
  try {
    const url = new URL(appUrl);
    return url.hostname;
  } catch (e) {
    console.error('Invalid NEXT_PUBLIC_APP_URL:', appUrl, e);
    return 'localhost'; 
  }
}

const APP_DOMAIN = getAppDomain();
let neynarClient: NeynarAPIClient | null = null;

export interface VerifiedJwtPayload {
  userId: string;
  fid: number;
  address?: string | null;
}

export async function verifyJwt(token: string): Promise<VerifiedJwtPayload> {
  if (!token) {
    throw new Error('Unauthorized: Token not provided');
  }

  try {
    const payload = await quickAuthClient.verifyJwt({
      token,
      domain: APP_DOMAIN, 
    });

    if (typeof payload.sub !== 'number') {
      throw new Error('Unauthorized: Invalid token payload (FID)');
    }
    const fid = payload.sub;

    if (!neynarApiKey) {
      throw new Error('Neynar API Key not configured. Cannot verify user.');
    }

    try {
        const config = new Configuration({ apiKey: neynarApiKey });
        neynarClient = new NeynarAPIClient(config);

      const neynarUserResponse = await neynarClient.fetchBulkUsers({ fids: [fid] });
      const neynarUser = neynarUserResponse.users[0];

      if (!neynarUser) {
        throw new Error(`User with FID ${fid} not found on Neynar.`);
      }

      const userWalletAddress = neynarUser.verified_addresses.eth_addresses[0] || null;

      const user = await prisma.user.upsert({
        where: { fid: fid },
        update: {
          username: neynarUser.username || `fid-${fid}`,
          displayName: neynarUser.display_name || '',
          pfpUrl: neynarUser.pfp_url || '',
        },
        create: {
          fid: fid,
          username: neynarUser.username || `fid-${fid}`,
          displayName: neynarUser.display_name || '',
          pfpUrl: neynarUser.pfp_url || '',
        },
      });

      return { userId: user.id, fid: fid, address: userWalletAddress };

    } catch (neynarError) {
      console.error(`Could not fetch profile data from Neynar for FID ${fid}.`, neynarError);
      throw new Error('Failed to verify user with Neynar.');
    }
  } catch (error: unknown) {
    if (error instanceof QuickAuthErrors.InvalidTokenError) {
      throw new Error('Unauthorized: Invalid token');
    }
    throw new Error('Unauthorized: JWT verification failed'); 
  }
}
