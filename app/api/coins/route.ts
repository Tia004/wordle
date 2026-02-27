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

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, message: 'Non autorizzato' }, { status: 401 });
        }

        const { amount } = await req.json();
        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, message: 'Importo non valido' }, { status: 400 });
        }

        // Check current balance first
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { coins: true }
        });

        if (!user || user.coins < amount) {
            return NextResponse.json({ success: false, message: 'Monete insufficienti!' }, { status: 402 });
        }

        const updated = await prisma.user.update({
            where: { email: session.user.email },
            data: { coins: { decrement: amount } },
            select: { coins: true }
        });

        return NextResponse.json({ success: true, newTotal: updated.coins });
    } catch (error) {
        console.error("Deduct coins error:", error);
        return NextResponse.json({ success: false, message: 'Errore interno' }, { status: 500 });
    }
}

