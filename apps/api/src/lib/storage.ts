import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Absolute path: apps/api/uploads — no importa desde dónde se ejecute el proceso
const UPLOADS_DIR = process.env['UPLOADS_DIR'] ?? join(__dirname, '../../../uploads')

export async function saveFile(file: File): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true })

  const ext = extname(file.name) || '.jpg'
  const filename = `${randomUUID()}${ext}`
  const filepath = join(UPLOADS_DIR, filename)

  const buffer = await file.arrayBuffer()
  await writeFile(filepath, Buffer.from(buffer))

  return `/uploads/${filename}`
}
