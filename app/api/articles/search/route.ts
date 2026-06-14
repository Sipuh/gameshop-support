import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { code: { contains: q } },
          { description: { contains: q } },
        ],
      },
      include: { category: true },
      orderBy: { order: 'asc' },
      take: 50,
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    );
  }
}