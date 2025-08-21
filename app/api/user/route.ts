import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fidString = searchParams.get('fid');

    if (!fidString) {
        return NextResponse.json({ error: 'fid is required' }, { status: 400 });
    }

    const fid = parseInt(fidString, 10);

    if (isNaN(fid)) {
        return NextResponse.json({ error: 'Invalid fid format' }, { status: 400 });
    }

    try {
        let user = await prisma.user.findUnique({
            where: { fid },
            include: {
                tickets: true,
                quests: true,
            },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    fid: fid,
                },
                include: {
                    tickets: true,
                    quests: true
                },
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
}
