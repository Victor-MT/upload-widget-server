import { fastifyCors } from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { uploadImageRoute } from './routes/upload-image'
import { getUploadsRoute } from './routes/get-uploads'
import { transformSwaggerSchema } from './transform-swagger-schema'
import { exportUploadsRoute } from './routes/export-uploads'

const server = fastify()

// When receiving data from the client, it will be validated using the validator compiler
server.setValidatorCompiler(validatorCompiler)

// when sending data back to the client, it will be serialized using the serializer compiler
server.setSerializerCompiler(serializerCompiler)

// Global error handler - avoid make a try/catch in all routes
server.setErrorHandler((error, request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: error.validation,
    })
  }
  // Here you can integrate with a remote logging service like DataDog, Sentry, etc.
  console.error(error)

  return reply.status(500).send({ message: 'Internal server error.' })
})

// CORS - Cross-Origin Resource Sharing -> who can access my API
server.register(fastifyCors, { origin: '*' })

server.register(fastifyMultipart)

server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Upload Server',
      description: 'API for a food delivery application',
      version: '1.0.0',
    },
  },
  transform: transformSwaggerSchema,
})

server.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

server.register(uploadImageRoute)
server.register(getUploadsRoute)
server.register(exportUploadsRoute)

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running on http://localhost:3333')
})
