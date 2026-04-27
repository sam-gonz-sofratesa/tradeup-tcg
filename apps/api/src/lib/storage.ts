import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'

const UPLOADS_DIR = process.env['UPLOADS_DIR'] ?? './uploads'

/**
 * Save a file to disk (dev environment).
 * In production, replace this function body with cloud upload logic.
 * The rest of the codebase uses this abstraction and won't need changes.
 */
export async function saveFile(file: File): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true })

  const ext = extname(file.name) || '.jpg'
  const filename = `${randomUUID()}${ext}`
  const filepath = join(UPLOADS_DIR, filename)

  const buffer = await file.arrayBuffer()
  await writeFile(filepath, Buffer.from(buffer))

  // Return relative path served as static
  return `/uploads/${filename}`
}
