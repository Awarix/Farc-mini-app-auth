import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ message: 'Token not provided' }, { status: 400 });
    }

    await verifyJwt(token);

    return NextResponse.json({ success: true, message: 'Authentication successful' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Authentication failed:', errorMessage);
    return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
  }
}
