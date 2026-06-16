import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const where = category ? { category: { key: category } } : {};

    const isGuide = searchParams.get('guide') === 'true';
    if (isGuide) {
      const whereGuide = { isGuide: true, ...(category ? { category: { key: category } } : {}) };
      const articles = await prisma.article.findMany({
        where: whereGuide,
        include: { category: true },
        orderBy: { order: 'asc' },
      });
      return NextResponse.json(articles);
    }

    const articles = await prisma.article.findMany({
      where,
      include: { category: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const article = await prisma.article.create({
      data: {
        title: body.title,
        code: body.code || null,
        description: body.description,
        solution: body.solution,
        image: body.image || null,
        categoryId: body.categoryId,
        order: body.order || 0,
        isGuide: body.isGuide || false,
        images: body.images ? JSON.stringify(body.images) : null,
      },
      include: { category: true },
    });
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}