import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        const { didWin, attempts } = await req.json();

        let stat = await prisma.gameStat.findUnique({
            where: { userId: session.user.id }
        });

        if (!stat) {
            stat = await prisma.gameStat.create({
                data: {
                    userId: session.user.id,
                    played: 0,
                    wins: 0,
                    currentStreak: 0,
                    maxStreak: 0,
                    winDistribution: JSON.stringify({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 })
                }
            });
        }

        const dist = JSON.parse(stat.winDistribution);
        if (didWin) {
            dist[attempts] = (dist[attempts] || 0) + 1;
        }

        const currentStreak = didWin ? stat.currentStreak + 1 : 0;
        const maxStreak = Math.max(stat.maxStreak, currentStreak);

        const updatedStat = await prisma.gameStat.update({
            where: { id: stat.id },
            data: {
                played: stat.played + 1,
                wins: stat.wins + (didWin ? 1 : 0),
                currentStreak,
                maxStreak,
                winDistribution: JSON.stringify(dist)
            }
        });

        let newTotalCoins = undefined;
        if (didWin) {
            const updatedUser = await prisma.user.update({
                where: { id: session.user.id },
                data: { coins: { increment: 100 } }
            });
            newTotalCoins = updatedUser.coins;
        }

        return NextResponse.json({ ...updatedStat, newTotalCoins });
    } catch (error) {
        console.error("Save stats error:", error);
        return NextResponse.json({ message: "Errore interno" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Non autorizzato" }, { status: 401 });
        }

        const stat = await prisma.gameStat.findUnique({
            where: { userId: session.user.id }
        });

        return NextResponse.json(stat || null);
    } catch (error) {
        console.error("Get stats error:", error);
        return NextResponse.json({ message: "Errore interno" }, { status: 500 });
    }
}
