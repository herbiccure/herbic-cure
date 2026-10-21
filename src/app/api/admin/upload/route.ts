import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/x-icon',
]);

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/x-matroska',
]);

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 60 * 1024 * 1024; // 60MB

async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'herbiccure_uploads';
    const cleanPublicId = filename.replace(/\.[^/.]+$/, '');

    // String to sign must be sorted alphabetically by parameter key
    const strToSign = `folder=${folder}&public_id=${cleanPublicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('public_id', cleanPublicId);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const json = await res.json();
      return json.secure_url || json.url || null;
    }

    const errText = await res.text();
    console.warn('Cloudinary upload returned non-200:', errText);
    return null;
  } catch (err) {
    console.warn('Cloudinary upload exception:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    const mimeType = file.type || 'image/jpeg';
    const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType) || mimeType.startsWith('video/');
    const isImage = ALLOWED_IMAGE_TYPES.has(mimeType) || mimeType.startsWith('image/');

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Only images (PNG, JPG, WebP, SVG, GIF) and videos (MP4, WebM, MOV) are supported.` },
        { status: 400 }
      );
    }

    const maxAllowedSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxAllowedSize) {
      return NextResponse.json(
        { error: `File size exceeds limit (${isVideo ? '60MB' : '15MB'})` },
        { status: 400 }
      );
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    let processedBuffer = originalBuffer;
    let finalMimeType = mimeType;
    let ext = '.png';
    let imgWidth: number | undefined;
    let imgHeight: number | undefined;

    if (isVideo) {
      // For video, bypass sharp processing
      const originalExt = path.extname(file.name || '').toLowerCase();
      if (originalExt && ['.mp4', '.webm', '.mov', '.ogg', '.mkv'].includes(originalExt)) {
        ext = originalExt;
      } else if (mimeType === 'video/webm') {
        ext = '.webm';
      } else if (mimeType === 'video/quicktime') {
        ext = '.mov';
      } else {
        ext = '.mp4';
      }
      finalMimeType = mimeType;
    } else if (mimeType !== 'image/svg+xml') {
      try {
        const image = sharp(originalBuffer);
        const meta = await image.metadata();
        imgWidth = meta.width;
        imgHeight = meta.height;

        let pipeline = image.rotate(); // auto-orient based on EXIF

        // If the image is gigantic (>2560px), resize down proportionally for web speed
        if ((meta.width && meta.width > 2560) || (meta.height && meta.height > 2560)) {
          pipeline = pipeline.resize({
            width: 2560,
            height: 2560,
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        // Convert heavy images to high-efficiency WebP
        if (
          mimeType === 'image/jpeg' ||
          mimeType === 'image/jpg' ||
          mimeType === 'image/webp' ||
          (mimeType === 'image/png' && originalBuffer.length > 400 * 1024)
        ) {
          pipeline = pipeline.webp({ quality: 85, effort: 4 });
          finalMimeType = 'image/webp';
          ext = '.webp';
        } else if (mimeType === 'image/png') {
          ext = '.png';
        } else if (mimeType === 'image/gif') {
          ext = '.gif';
        }

        processedBuffer = await pipeline.toBuffer();
      } catch (sharpErr) {
        console.warn('Sharp optimization fallback:', sharpErr);
        processedBuffer = originalBuffer;
      }
    } else {
      ext = '.svg';
      finalMimeType = 'image/svg+xml';
    }

    const safeBase = (file.name || (isVideo ? 'video' : 'image'))
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    const filename = `${safeBase}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;

    // -------------------------------------------------------------
    // 2. Option A: Cloudinary (if configured)
    // -------------------------------------------------------------
    const cloudinaryUrl = await uploadToCloudinary(
      processedBuffer,
      finalMimeType,
      filename,
      isVideo ? 'video' : 'image'
    );
    if (cloudinaryUrl) {
      return NextResponse.json({
        success: true,
        url: cloudinaryUrl,
        filename,
        size: processedBuffer.length,
        mimeType: finalMimeType,
        width: imgWidth,
        height: imgHeight,
        provider: 'cloudinary',
      });
    }

    // -------------------------------------------------------------
    // 3. Option B: Supabase Storage (if configured)
    // -------------------------------------------------------------
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
            'Content-Type': finalMimeType,
            'x-upsert': 'true',
          },
          body: processedBuffer,
        });

        if (uploadRes.ok) {
          const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${supabaseBucket}/${filename}`;
          return NextResponse.json({
            success: true,
            url: publicUrl,
            filename,
            size: processedBuffer.length,
            mimeType: finalMimeType,
            width: imgWidth,
            height: imgHeight,
            provider: 'supabase',
          });
        }
      } catch (sbErr) {
        console.warn('Supabase storage upload error:', sbErr);
      }
    }

    // -------------------------------------------------------------
    // 4. Option C: Local filesystem write (public/uploads)
    // -------------------------------------------------------------
    let savedToDisk = false;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fullFilePath = path.join(uploadsDir, filename);
      fs.writeFileSync(fullFilePath, processedBuffer);
      savedToDisk = true;
    } catch (fsErr) {
      console.warn('Filesystem write unavailable (serverless environment):', fsErr);
    }

    // -------------------------------------------------------------
    // 5. Option D: Serverless Data URI fallback (safe, compact WebP)
    // -------------------------------------------------------------
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !savedToDisk);

    let publicUrl = `/uploads/${filename}`;
    // If on serverless where public/ writes are ephemeral and no Cloud CDN is configured,
    // use the sharp-compressed Data URI (< 400KB) so the image renders permanently
    if (isServerless && !isVideo && processedBuffer.length <= 3 * 1024 * 1024) {
      publicUrl = `data:${finalMimeType};base64,${processedBuffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: processedBuffer.length,
      mimeType: finalMimeType,
      width: imgWidth,
      height: imgHeight,
      provider: isServerless ? 'embedded' : 'local',
    });
  } catch (error: any) {
    console.error('File upload failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
