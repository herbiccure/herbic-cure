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

    // 1. Check if Supabase Storage is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || 'media';

    if (supabaseUrl && supabaseKey) {
      try {
        const uploadEndpoint = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${supabaseBucket}/${filename}`;
        const uploadRes = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'true',
          },
          body: buffer,
        });

        if (uploadRes.ok) {
          const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${supabaseBucket}/${filename}`;
          return NextResponse.json({
            success: true,
            url: publicUrl,
            filename,
            size: file.size,
            mimeType,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase storage upload error:', sbErr);
      }
    }

    // 2. Local filesystem write (effective for persistent Node servers and local development)
    let savedToDisk = false;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fullFilePath = path.join(uploadsDir, filename);
      fs.writeFileSync(fullFilePath, buffer);
      savedToDisk = true;
    } catch (fsErr) {
      console.warn('Filesystem write unavailable (serverless environment):', fsErr);
    }

    // 3. For serverless production (e.g. Vercel) where local public/ uploads are ephemeral,
    // return an optimized self-contained Data URI so the image displays permanently without 404
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !savedToDisk);

    let publicUrl = `/uploads/${filename}`;
    if (isServerless && buffer.length <= 4 * 1024 * 1024) {
      publicUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    // Record in media database if available
    try {
      await prisma.media.create({
        data: {
          name: file.name || filename,
          url: publicUrl,
          alt: file.name || 'Store Media',
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
