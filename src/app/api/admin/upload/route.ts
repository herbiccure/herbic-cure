import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/x-icon',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit (10MB)' },
        { status: 400 }
      );
    }

    // Determine MIME type and safe extension
    const mimeType = file.type || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Only PNG, JPG, WebP, SVG, GIF are supported.` },
        { status: 400 }
      );
    }

    let ext = '.png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = '.jpg';
    else if (mimeType === 'image/webp') ext = '.webp';
    else if (mimeType === 'image/svg+xml') ext = '.svg';
    else if (mimeType === 'image/gif') ext = '.gif';
    else if (mimeType === 'image/x-icon') ext = '.ico';
    else {
      const originalExt = path.extname(file.name || '');
      if (originalExt && /^\.[a-zA-Z0-9]+$/.test(originalExt)) {
        ext = originalExt;
      }
    }

    const safeBase = (file.name || 'logo')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    const filename = `${safeBase}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Target upload locations
    const uploadLocations = [
      path.join(process.cwd(), 'public', 'uploads'),
      path.join('C:\\Users\\Asus\\.gemini\\antigravity-ide\\scratch\\herbicCure', 'public', 'uploads'),
      path.join('d:\\Codes\\Projects\\herbicCure-main', 'public', 'uploads'),
    ];

    for (const dir of uploadLocations) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const fullFilePath = path.join(dir, filename);
        fs.writeFileSync(fullFilePath, buffer);
      } catch (err) {
        // Continue writing to other locations if one path doesn't exist
      }
    }

    const publicUrl = `/uploads/${filename}`;

    // Record in media database if available
    try {
      await prisma.media.create({
        data: {
          name: file.name || filename,
          url: publicUrl,
          alt: file.name || 'Store Logo',
          sizeBytes: file.size,
          mimeType,
        },
      });
    } catch (e) {
      // Non-fatal if media table create has issues
      console.warn('Could not record to media table:', e);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      mimeType,
    });
  } catch (error: any) {
    console.error('File upload failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
