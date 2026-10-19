import { z } from 'zod';

export const requestParamSchema = z.object({
  id: z.coerce.string(),
});

export const requestParamSchemaWithFileId = z.object({
    id: z.coerce.string(),
    file_id: z.coerce.string(),
});

export const downloadTranscriptForProtocol = z.object({
    protocol_id: z.coerce.string(),
    transcript_id: z.coerce.string(),
});

export type DownloadTranscriptForProtocol = z.infer<typeof downloadTranscriptForProtocol>;

export const fileResponse = z.any();

export type FileResponse = z.infer<typeof fileResponse>;

export type RequestParamSchemaWithFileId = z.infer<typeof requestParamSchemaWithFileId>;

export const requestParamSchemaCompanyId = z.object({
  companyId: z.coerce.string(),
});

export type RequestParamSchemaCompanyId = z.infer<typeof requestParamSchemaCompanyId>;

export const requestQueryEmailSchema = z.object({
  email: z.string().email(),
});

export const countResponseSchema = z.number();

export const idParamAndEmailQuerySchema = requestParamSchema.merge(requestQueryEmailSchema);

export const requestQueryBuildingEgidSchema = z.object({
  egid: z.coerce.number(),
});
export const requestQueryBuildingEgidSchemaWithAddress = z.object({
  egid: z.coerce.number(),
  address: z.string().optional(),
});
export const requestQueryLangSchema = z.object({
  lang: z.union([z.literal('de-CH'), z.literal('en')]),
});

export type Language = z.infer<typeof requestQueryLangSchema>;

export const responseBoolean = z.object({
  value: z.boolean(),
});

export const responseId = z.object({
  id: z.string(),
});

export const responseStatusCode = z.number();

export type GetBooleanResponse = z.infer<typeof responseBoolean>;

export type GetIdResponse = z.infer<typeof responseId>;

export type GetStatusCodeResponse = z.infer<typeof responseStatusCode>;

export type GetIdParam = z.infer<typeof requestParamSchema>;
export type GetEmailQueryParam = z.infer<typeof requestQueryEmailSchema>;
export type GetIdAndEmailQueryParam = z.infer<typeof idParamAndEmailQuerySchema>;

export type GetCountResponseSchema = z.infer<typeof countResponseSchema>;

export const queryBase = z.object({
  page: z.coerce.number(),
  pageSize: z.coerce.number(),
  text: z.string().optional(),
});

export const formDataFileSchema = z.object({
  file: z.instanceof(FormData),
});

export type FormDataFileSchema = z.infer<typeof formDataFileSchema>;

export const idsBodySchema = z.string().uuid().array();
export type IdsBodySchema = z.infer<typeof idsBodySchema>;
