//import type { FastifyInstance } from 'fastify'

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'

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
        body: z.object({
          name: z.string(),
          password: z.string().optional(),
        }),
        response: {
          201: z.object({ uploadId: z.string() }),
          409: z.object({
            message: z.string().describe('Upload already existis.'),
          }),
        },
      },
    },
    async (request, reply) => {
      // Here you can handle the file upload logic

      await db.insert(schema.uploads).values({
        name: 'test.jpg',
        remoteKey: 'remote-key',
        remoteUrl: 'https://example.com/image.png',
      })

      return reply.status(201).send({ uploadId: 'fake-id' })
    }
  )
}
