import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogg': 'video/ogg',
  '.m4v': 'video/mp4',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const publicPath = path.join(process.cwd(), 'public', 'uploads', filename);
    const rootPath = path.join(process.cwd(), 'uploads', filename);

    let targetPath = '';
    if (fs.existsSync(publicPath)) {
      targetPath = publicPath;
    } else if (fs.existsSync(rootPath)) {
      targetPath = rootPath;
    }

    if (!targetPath) {
      // Check database Media fallback for serverless environments
      try {
        const media = await prisma.media.findFirst({
          where: { name: filename },
        });

        if (media?.url) {
          if (media.url.startsWith('data:')) {
            const matches = media.url.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              const contentType = matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              return new NextResponse(buffer, {
                headers: {
                  'Content-Type': contentType,
                  'Content-Length': String(buffer.length),
                  'Cache-Control': 'public, max-age=31536000, immutable',
                },
              });
            }
          } else if (media.url.startsWith('http')) {
            return NextResponse.redirect(media.url, 307);
          }
        }
      } catch (dbErr) {
        logger.debug('media.db_lookup_fallback', { error: (dbErr as any)?.message });
      }

      return new NextResponse('File not found', { status: 404 });
    }

    const stat = await fs.promises.stat(targetPath);
    const fileSize = stat.size;
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    const range = request.headers.get('range');
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(targetPath, { start, end });

      const readable = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(readable as unknown as BodyInit, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const fileStream = fs.createReadStream(targetPath);
    const readable = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new NextResponse(readable as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}

