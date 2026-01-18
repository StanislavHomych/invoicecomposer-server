import * as fs from 'fs/promises';
import * as path from 'path';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const STORAGE_PATH = process.env.STORAGE_PATH || './uploads';

// Ensure uploads directory exists
async function ensureUploadsDir() {
  if (STORAGE_TYPE === 'local') {
    try {
      await fs.mkdir(STORAGE_PATH, { recursive: true });
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
    }
  }
}

ensureUploadsDir();

export async function saveFile(fileName: string, buffer: Buffer): Promise<string> {
  if (STORAGE_TYPE === 'local') {
    const filePath = path.join(STORAGE_PATH, fileName);
    await fs.writeFile(filePath, buffer);
    return `/uploads/${fileName}`;
  }
  
  // S3 implementation would go here
  throw new Error('S3 storage not implemented yet');
}

export async function getFile(fileName: string): Promise<Buffer> {
  if (STORAGE_TYPE === 'local') {
    const filePath = path.join(STORAGE_PATH, fileName);
    return await fs.readFile(filePath);
  }
  
  // S3 implementation would go here
  throw new Error('S3 storage not implemented yet');
}

export function getFileUrl(fileName: string): string {
  if (STORAGE_TYPE === 'local') {
    return `/uploads/${fileName}`;
  }
  
  // S3 implementation would go here
  throw new Error('S3 storage not implemented yet');
}
