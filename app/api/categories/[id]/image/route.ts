import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Используем raw query для получения imageData
    const result = await prisma.$queryRaw<Array<{ image_data: Buffer | null }>>`
      SELECT image_data FROM "categories" WHERE id = ${params.id}
    `;

    const imageData = result[0]?.image_data;

    if (!imageData) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Определяем MIME-тип по первым байтам
    let mimeType = 'image/png';
    if (imageData.length > 2) {
      if (imageData[0] === 0xFF && imageData[1] === 0xD8) {
        mimeType = 'image/jpeg';
      } else if (imageData[0] === 0x89 && imageData[1] === 0x50) {
        mimeType = 'image/png';
      } else if (imageData[0] === 0x47 && imageData[1] === 0x49) {
        mimeType = 'image/gif';
      } else if (imageData[0] === 0x52 && imageData[1] === 0x49) {
        mimeType = 'image/webp';
      }
    }

    // Конвертируем Buffer в Uint8Array для NextResponse
    const uint8Array = new Uint8Array(imageData);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching category image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}