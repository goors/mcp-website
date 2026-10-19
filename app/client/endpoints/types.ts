import type { ZodSchema } from 'zod';
import { type QueryParam } from '../core';

type NonVoid = Exclude<unknown, null | undefined>;

type EnforceNonVoid<TBody, TQuery> = [TBody, QueryParam, TQuery] extends [void, void, void]
  ? never
  : NonVoid;

export type FetchioEndpoint<TResponse, TBody = void, TQuery = void> =
  | (EnforceNonVoid<TBody, TQuery> & {
      method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'GET';
      url: string;
      responseSchema?: ZodSchema<TResponse>;
    } & Partial<{
        requestBodySchema: TBody extends void ? never : ZodSchema<TBody>;
        requestParamSchema: ZodSchema<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        requestQuerySchema: TQuery extends void ? never : ZodSchema<TQuery>;
      }>)
  | {
      method: 'GET';
      url: string;
      responseSchema: ZodSchema<TResponse>;
      requestParamSchema?: ZodSchema<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      requestQuerySchema?: TQuery extends void ? never : ZodSchema<TQuery>;
    };
