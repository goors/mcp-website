import { type z } from 'zod';

import { type FetchioEndpoint } from '../endpoints/types';
import { type FetchioOptionSchema } from './validator';
import {
  requestParamSchema,
  requestQueryBuildingEgidSchema,
  requestQueryLangSchema,
} from '../validators';

export interface FetchioClientInit extends FetchioClientOptions {
  apiUrl: string;
  handle?: Partial<FetchioEventHandlers>;
  companyId?: string;
  getAccessToken: () => Promise<string|null>;
}
export interface FetchioClient {
  apiUrl: string;
  options: FetchioClientOptions;
  authenticated: boolean;
  fetchData: (url: URL | RequestInfo, options?: RequestInit) => Promise<Response>;
  getAccessToken: () => Promise<string>;
}

export interface FetchioCredentials {
  username: string;
  password: string;
}

export type FetchioClientOptions = z.infer<typeof FetchioOptionSchema>;

type FetchioQueryOptions = RequestInit;
export interface FetchioQuery<TRequest, TResponse> {
  client: FetchioClient;
  endpoint: FetchioEndpoint<TRequest, TResponse>;
  options?: FetchioQueryOptions;
}

export const FetchioEvents = {
  unauthenticated: 'UNAUTHENTICATED',
  unauthorized: 'UNAUTHORIZED',
  internalError: 'INTERNAL_ERROR',
} as const;

export interface FetchioEventPayload {
  event: typeof FetchioEvents;
  message?: string;
}

export type EventHandler = (payload: FetchioEventPayload) => void;

export type FetchioEventHandlers = {
  [Key in keyof typeof FetchioEvents]: (payload: {
    event: (typeof FetchioEvents)[Key];
    message?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }) => void;
};

export type QueryParam = z.infer<typeof requestParamSchema>;
export type QueryParamBuildingEgid = z.infer<typeof requestQueryBuildingEgidSchema>;
export type QueryLangSchema = z.infer<typeof requestQueryLangSchema>;
