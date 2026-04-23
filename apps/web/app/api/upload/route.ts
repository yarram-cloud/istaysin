import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

// Configure Cloudinary only if variables exist
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // If production or Cloudinary configured, use Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME) {
       return new Promise<NextResponse>((resolve) => {
         const uploadStream = cloudinary.uploader.upload_stream(
           { folder: 'istays' },
           (error, result) => {
             if (error) {
               console.error('[Cloudinary Upload Error]', error);
               resolve(NextResponse.json({ success: false, error: 'Cloudinary upload failed' }, { status: 500 }));
               return;
             }
             resolve(NextResponse.json({ success: true, url: result?.secure_url }));
           }
         );
         uploadStream.end(buffer);
       });
    }

    // LOCAL DEVELOPMENT
    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = file.name.split('.').pop() || 'tmp';
    // Use a URL safe fast random string
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
    
  } catch (err: any) {
    console.error('[UPLOAD ROUTE ERROR]', err);
    return NextResponse.json({ success: false, error: 'Server fault' }, { status: 500 });
  }
}
