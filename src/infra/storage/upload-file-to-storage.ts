import { Upload } from "@aws-sdk/lib-storage";
import { randomUUID } from "crypto";
import { basename, extname } from "path";
import { Readable } from "stream";
import { z } from "zod"; 
import { r2 } from "./client";
import { env } from "@/env";


const uploadFileToStorageInput = z.object({
    folder: z.enum(['images', 'downloads']), // no cloudflare você consegue controlar rotinas de deleção por prefixo ou "pasta"
    fileName: z.string(),
    contentType: z.string(),
    contentStream: z.instanceof(Readable),

})

type uploadFileToStorageInput = z.input<typeof uploadFileToStorage>

export async function uploadFileToStorage(input: uploadFileToStorageInput) {
    const { folder, fileName, contentType, contentStream } = uploadFileToStorageInput.parse(input)

    const fileExtension = extname(fileName)
    const fileNameWithoutExtension = basename(fileName)
    const sanitizedFileName = fileNameWithoutExtension.replace(/[^a-zA-Z0-9]/g, '')
    const sanitizedFileNameWithExtension = sanitizedFileName.concat(fileExtension)

    const uniqueFileName = `${folder}/${randomUUID()}-${sanitizedFileNameWithExtension}`

    const upload = new Upload({
        client: r2,
        params:{
            Key: uniqueFileName,
            Bucket: env.CLOUDFLARE_BUCKET,
            Body: contentStream,
            ContentType: contentType
        }
    })

    await upload.done()

    return {
        key: uniqueFileName,
        url: new URL(uniqueFileName, env.CLOUDFLARE_PUBLIC_URL).toString(),
    }
    
}