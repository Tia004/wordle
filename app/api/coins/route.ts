import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ coins: 0 }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { coins: true }
        });

        return NextResponse.json({ coins: user?.coins || 0 });
    } catch (error) {
        console.error("Get coins error:", error);
        return NextResponse.json({ coins: 0 }, { status: 500 });
    }
}
