import { isRight, unwrapEither } from "@/infra/shared/either"
import { makeUpload } from "@/test/factories/make-uploads"
import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { exportUploads } from "./export-uploads"
import * as upload from '@/infra/storage/upload-file-to-storage'

describe('get uploads', () => {
    it('should be able to export uploads', async () => {
        // spy => monitorar que algo foi executado
        // stub => quero modificar o compartamento de algo

        const uploadStub = vi
            .spyOn(upload, 'uploadFileToStorage')
            .mockImplementationOnce(async () => {
                return {
                    key: `${randomUUID()}.csv`,
                    url: 'http://example.com/file.csv'
                }
            })
        const namePattern = randomUUID()
        
        const upload1 = await makeUpload({ name: `${namePattern}.webp`})
        const upload2 = await makeUpload({ name: `${namePattern}.webp`})
        const upload3 = await makeUpload({ name: `${namePattern}.webp`})
        const upload4 = await makeUpload({ name: `${namePattern}.webp`})
        const upload5 = await makeUpload({ name: `${namePattern}.webp`})

        // sut = 
        const sut = await exportUploads({
            searchQuery: namePattern,
        })

        const generatedCSVStream = uploadStub.mock.calls[0][0].contentStream

        const csvAsString = await new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = []

            generatedCSVStream.on('data', (chunk: Buffer) => {
                chunks.push(chunk)
            })

            generatedCSVStream.on('end', () => {
               resolve(Buffer.concat(chunks).toString('utf-8')) 
            })

            generatedCSVStream.on('error', (err: any) => {
               reject(err) 
            })
        })

        const csvAsArray = csvAsString
            .trim()
            .split('\n')
            .map(row => row.split(','))

        expect(isRight(sut)).toBe(true)

        expect(unwrapEither(sut)).toEqual({
            reportUrl: 'http://example.com/file.csv'
        })

        expect(csvAsArray).toEqual([
            ['ID', 'Name', 'URL', 'Uploaded at'],
            [upload1.id, upload1.name, upload1.remoteUrl, expect.any(String)],
            [upload2.id, upload2.name, upload2.remoteUrl, expect.any(String)],
            [upload3.id, upload3.name, upload3.remoteUrl, expect.any(String)],
            [upload4.id, upload4.name, upload4.remoteUrl, expect.any(String)],
            [upload5.id, upload5.name, upload5.remoteUrl, expect.any(String)],

        ])


       
    })
})