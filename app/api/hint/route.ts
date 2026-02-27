import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { answer, usedColors } = await req.json();

        if (!answer) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.coins < 100) {
            return NextResponse.json({ error: "Not enough coins" }, { status: 402 });
        }

        // Find a letter in answer that is not yet fully found (not CORRECT or PRESENT in usedColors)
        const answerLetters = answer.split('');
        const missingLetters = answerLetters.filter((char: string) => {
            return !usedColors[char];
        });

        if (missingLetters.length === 0) {
            return NextResponse.json({ error: "No hints available" }, { status: 400 });
        }

        const randomHintLetter = missingLetters[Math.floor(Math.random() * missingLetters.length)];

        // Deduct 100 coins
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { coins: { decrement: 100 } }
        });

        return NextResponse.json({ success: true, hint: randomHintLetter, coins: updatedUser.coins });
    } catch (error) {
        console.error("Hint API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
