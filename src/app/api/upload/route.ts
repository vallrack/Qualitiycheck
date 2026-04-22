import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const files = data.getAll('files') as File[];
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Carpeta destino: public/uploads/convivencia en la raíz del proyecto
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'convivencia');
    
    // Asegurar que el directorio existe
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignorar si ya existe
    }

    const uploadedUrls: string[] = [];

    // Escribir cada archivo en el disco duro físico
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Sanitizar el nombre del archivo y añadir una marca de tiempo para evitar colisiones
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = `${Date.now()}_${safeName}`;
      const filePath = join(uploadDir, uniqueName);
      
      await writeFile(filePath, buffer);
      
      // La URL pública con la que Next.js servirá el archivo
      uploadedUrls.push(`/uploads/convivencia/${uniqueName}`);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error: any) {
    console.error('Local Upload Error:', error);
    return NextResponse.json({ error: 'Error procesando los archivos internamente' }, { status: 500 });
  }
}
