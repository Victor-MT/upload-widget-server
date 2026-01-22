//import type { FastifyInstance } from 'fastify'

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { uploadImage } from '@/app/functions/upload-image'
import { isRight, unwrapEither } from '@/infra/shared/either'

/* 

// Sample of syncronous route

export function uploadImageRoute(server: FastifyInstance) {
  server.post('/uploads', () => {
    // Here you can handle the file upload logic
    return 'Hello World'
  })
} 
  
*/

export const uploadImageRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        consumes:['multipart/form-data'],
        response: {
          201: z.object({ uploadId: z.string() }),
          400: z.object({ message: z.string() })
        },
      },
    },
    async (request, reply) => {
      // Here you can handle the file upload logic
      const uploadedFile = await request.file({
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      })

      console.log(uploadedFile)
    
      if (!uploadedFile) {
        return reply.status(400).send({ message: 'File is required.' })
      }

      const result = await uploadImage({
        fileName: uploadedFile.filename,
        contentType: uploadedFile.mimetype,
        contentStream: uploadedFile.file,
      })

      if (isRight(result)){
        console.log(unwrapEither(result))
        
        return reply.status(201).send()
      }

     const error = unwrapEither(result)

     switch (error.constructor.name){
      case 'InvalidFileFormat':
        return reply.status(400).send({ message: error.message })
     }
      
    }
  )
}
