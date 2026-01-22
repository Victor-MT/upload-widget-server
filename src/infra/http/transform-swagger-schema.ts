import { jsonSchemaTransform } from 'fastify-type-provider-zod'

type transformSwaggerSchemaData = Parameters<typeof jsonSchemaTransform>[0]
/*
Fastify Swagger does not support 'multipart/form-data' out of the box.
This function transforms the Swagger schema to include the necessary
configuration for handling file uploads.
*/
export function transformSwaggerSchema(data: transformSwaggerSchemaData) {  
    const { schema, url } =  jsonSchemaTransform(data)

    if (schema.consumes?.includes('multipart/form-data')) {
        if(schema.body===undefined){
            schema.body = {
                type: 'object',
                required: [],
                properties: {},
            }
        }

        schema.body.properties.file = {
            type: 'string',
            format: 'binary',
        }

        schema.body.required.push('file')
    
    }

    return { schema, url }   
}