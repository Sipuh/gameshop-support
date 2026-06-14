import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const categorySelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  colorClass: true,
  borderColor: true,
  icon: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { articles: true },
  },
} as const;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      select: categorySelect,
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const data: Record<string, unknown> = {
      key: body.key,
      name: body.name,
      description: body.description,
      colorClass: body.colorClass || 'c-purple',
      borderColor: body.borderColor || 'var(--purple-lite)',
      icon: body.icon,
      order: body.order || 0,
    };

    if (body.imageData) {
      const base64Data = body.imageData.replace(/^data:image\/\w+;base64,/, '');
      data.imageData = Buffer.from(base64Data, 'base64');
    }

    const category = await prisma.category.create({
      data: data as any,
      select: categorySelect,
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}