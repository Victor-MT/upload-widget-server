import { db, pg } from "@/infra/db";
import { schema } from "@/infra/db/schemas";
import { type Either, makeRight } from "@/infra/shared/either";
import { z } from "zod";
import { ilike } from 'drizzle-orm';
import { stringify } from "csv-stringify";
import { PassThrough, Transform } from "node:stream";
import { uploadFileToStorage } from "@/infra/storage/upload-file-to-storage";
import { pipeline } from "node:stream/promises";

const exportUploadsInput = z.object({
    searchQuery: z.string().optional(),
})

type ExportUploadsInput = z.input<typeof exportUploadsInput>

type ExportUploadsOutput = {
    reportUrl: string
}

export async function exportUploads(
    input: ExportUploadsInput
): Promise<Either<never, ExportUploadsOutput>> {

    const { searchQuery } = exportUploadsInput.parse(input)
    const { sql, params } = db
        .select({
            id: schema.uploads.id,
            name: schema.uploads.name,
            remoteUrl: schema.uploads.remoteUrl,
            createdAt: schema.uploads.createdAt,
        })
        .from(schema.uploads)
        .where(
            searchQuery ? ilike(schema.uploads.name,`%${searchQuery}%`) : undefined,
        ).toSQL()
    
    const cursor = pg.unsafe(sql, params as string[]).cursor(2) // geralmento usamos 50

    const csv = stringify({
        delimiter: ',',
        header: true,
        columns: [
            {key: 'id', header: 'ID'},
            {key: 'name', header: 'Name'},
            {key: 'remote_url', header: 'URL'},
            {key: 'created_at', header: 'Uploaded at'},
        ]
    })
    const uploadToStorageStream = new PassThrough()

    // COMO FUNCIONA PIPELINE: READABLE / TRANSFORM / TRANSFORM / WRITABLE
    const convertToCsvPipeline = pipeline(
        cursor, // READABLE
        new Transform({
            objectMode: true,
            transform(chunks: unknown[], encoding, callback){
                for (const chunk of chunks){
                    this.push(chunk)
                }
                callback()
            }
        }),
        csv, // TRANSFORM
        uploadToStorageStream,  // WRITABLE
    )

    const uploadToStorage = uploadFileToStorage({
        contentType: 'text/csv',
        folder: 'downloads',
        fileName: `${new Date().toISOString()}-uploads.csv`,
        contentStream: uploadToStorageStream
    })
    
    const [{ url }] = await Promise.all([
        uploadToStorage,
        convertToCsvPipeline,
    ])

    return makeRight({ reportUrl: url })   
}