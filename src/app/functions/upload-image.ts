import { db } from '@/infra/db';
import { schema } from '@/infra/db/schemas';
import { Either, makeLeft, makeRight } from '@/infra/shared/either';
import { Readable } from 'node:stream';
import { z } from 'zod';
import { InvalidFileFormat } from './errors/invalid-file-format';
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage';

const uploadImageInput = z.object({
    fileName: z.string(),
    contentType: z.string(),
    contentStream: z.instanceof(Readable),
})

type UploadImageInput = z.infer<typeof uploadImageInput>;

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function uploadImage(
    input: UploadImageInput
): Promise<Either<InvalidFileFormat, {url: string}>> {
    const { fileName, contentType, contentStream } = uploadImageInput.parse(input);

    if (!allowedMimeTypes.includes(contentType)) {
        //throw new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.');
        return makeLeft(new InvalidFileFormat())
    }
    
    // Here you can implement the logic to upload the image to a storage service
    // For example, uploading to AWS S3, Google Cloud Storage, etc.

    const { key, url } = await uploadFileToStorage({
        folder: 'images',
        fileName,
        contentType,
        contentStream,

    })

    await db.insert(schema.uploads).values({
        name: fileName,
        remoteKey: key,
        remoteUrl: url
    })

    return makeRight({ url })
}