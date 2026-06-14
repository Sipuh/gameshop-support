import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Селект без imageData для JSON ответов
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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: categorySelect,
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    
    const data: Record<string, unknown> = {};

    if (body.key !== undefined) data.key = body.key;
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.colorClass !== undefined) data.colorClass = body.colorClass;
    if (body.borderColor !== undefined) data.borderColor = body.borderColor;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.order !== undefined) data.order = body.order;

    // Если передан imageData в base64, конвертируем в Buffer
    if (body.imageData) {
      const base64Data = body.imageData.replace(/^data:image\/\w+;base64,/, '');
      data.imageData = Buffer.from(base64Data, 'base64');
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data,
      select: categorySelect,
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.category.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}