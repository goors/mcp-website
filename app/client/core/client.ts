import type { RequireAtLeastOne } from 'type-fest';
import { z, ZodError } from 'zod';

import { type FetchioEndpoint } from '../endpoints/types';
import { removeDoubleSlash } from '../util/stringManipulation';
import { FetchioEvents } from './types';

import type { FetchioClient, FetchioClientInit } from './types';

export function createFetchio({
  apiUrl,
  debug = false,
  lang = 'en',
  companyId,
  handle,
  getAccessToken,
}: FetchioClientInit): FetchioClient {
  try {
    console.debug(`[Fetchio]: create client with logging ${debug ? 'enabled' : 'disabled'}.`);
    let retriedWithAuth = false;

    const fetchWithDefaults: typeof fetch = async (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set('accept-language', lang);

        // --- FIX: Only default to JSON if it's NOT a FormData request ---
        if (!(init?.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        // 2. ONLY call if it exists
        if (getAccessToken) {
            try {
                const token = await getAccessToken();
                // console.log("Token retrieved:", token); // Keep this for debugging
                if (token) {
                    headers.set('Authorization', `Bearer ${token}`);
                }
            } catch (err) {
                // console.error("[Fetchio]: Error getting token:", err);
                // If token fails, you might want to continue or throw
            }
        }

        if (companyId !== undefined) {
            headers.set('Company-Id', companyId);
        }

      const response = await fetch(input, {
        ...init,
        headers,
        credentials: 'include',
      });

      if (response.status === 401) {
        if (!retriedWithAuth) {
          retriedWithAuth = true;
          // TODO: refresh token
          return fetchWithDefaults(input, init);
        } else {
          if (handle?.unauthenticated) {
            if (debug) {
              console.warn('[Fetchio]: handle unauthenticated.');
            }
            handle.unauthenticated({
              event: FetchioEvents.unauthenticated,
              message: response.statusText,
            });
          }
          throw new Error(`[Fetchio]: HTTP 401 with ${response.statusText}`);
        }
      }

      if (response.status === 403) {
        if (handle?.unauthorized) {
          if (debug) {
            console.warn('[Fetchio]: handle unauthorized.');
          }
          handle.unauthorized({ event: FetchioEvents.unauthorized });
        }
        throw new Error(`[Fetchio]: access denied.`);
      }

      if (response.status === 500) {
        if (handle?.internalError) {
          if (debug) {
            console.warn('[Fetchio]: handle internal error.');
          }
          handle.internalError({ event: FetchioEvents.internalError, message: response });
        }

        if ((input as string).indexOf('upload') > -1) {
          return response;
        }
        throw new Error(`[Fetchio]: internal server error`);
      }

      if (response.status === 404) {
        if (handle?.internalError) {
          if (debug) {
            console.warn('[Fetchio]: handle internal error.');
          }
          handle.internalError({ event: FetchioEvents.internalError, message: response });
        }

        if ((input as string).indexOf('upload') > -1) {
          return response;
        }
        throw new Error(`[Fetchio]: internal server error`);
      }

      return response;
    };

    return {
      apiUrl,
      options: { debug },
      authenticated: false,
      fetchData: fetchWithDefaults,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(
        '[Fetchio]: invalid client configuration.',
        error,
        JSON.stringify(error.flatten().fieldErrors, null, 2)
      );
    }
    throw error;
  }
}
const cleanQuery = <T extends object>(query: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(query).filter(([_, v]) => v !== undefined) // eslint-disable-line @typescript-eslint/no-unused-vars
  ) as Partial<T>;
};

export async function query<TResponse, TBody = void, TQuery = void>(
  { fetchData, apiUrl, options }: FetchioClient,
  endpoint: FetchioEndpoint<TResponse, TBody, TQuery>,
  data: RequireAtLeastOne<{
    body: TBody extends void ? never : TBody;
    param: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    query: TQuery extends void ? never : TQuery;
  }> | null,
  signal?: AbortSignal,
  isPdf = false,
  isCompleteResponse = false,
  isStream = false,
): Promise<TResponse> {
  const {
    method,
    url: endpointUrl,
    responseSchema,
    requestParamSchema,
    requestQuerySchema,
  } = endpoint;

  let requestBodySchema;
  if (method !== 'GET') {
    requestBodySchema = endpoint.requestBodySchema;
  }
  const validatedBody = requestBodySchema?.parse(data?.body);
  const validatedParam = requestParamSchema?.parse(data?.param);
  const validatedQuery = requestQuerySchema?.parse(data?.query);

  try {
    const fullURL = removeDoubleSlash(`${apiUrl}${endpointUrl}`);

    const urlValidation = z.string().url().safeParse(fullURL);
    if (!urlValidation.success) {
      throw new Error(`[Fetchio]: invalid URL: ${fullURL} is not a valid URL`);
    }
    const url = new URL(urlValidation.data);

    if (validatedParam) {
      for (const key in validatedParam) {
        if (Object.prototype.hasOwnProperty.call(validatedParam, key)) {
          const encodedPlaceholder = `%7B${key}%7D`;
          url.pathname = url.pathname.replace(
            new RegExp(encodedPlaceholder, 'g'),
            validatedParam[key]
          );
        }
      }
    }

    if (validatedQuery) {
      if (Array.isArray(validatedQuery)) {
        for (const entry of validatedQuery) {
          for (const [key, value] of Object.entries(entry)) {
            url.searchParams.append(key, value as any); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        }
      } else {
        const q = cleanQuery(validatedQuery);
        for (const [key, value] of Object.entries(q)) {
          if (Array.isArray(value)) {
            for (const item of value) {
              url.searchParams.append(key, item);
            }
          } else {
            url.searchParams.append(key, value as string);
          }
        }
      }
    }

      if (options?.debug) {
          // 1. Process the body if it's an instance of FormData
          let loggedBody = validatedBody;

          if (validatedBody instanceof FormData) {
              const dataObj = {};
              validatedBody.forEach((value, key) => {
                  if (value instanceof File) {
                      // If it's a file/CV, log its info instead of [object File]
                      dataObj[key] = `[File: ${value.name} (${(value.size / 1024).toFixed(2)} KB)]`;
                  } else {
                      dataObj[key] = value;
                  }
              });
              loggedBody = dataObj;
          }

          // 2. Print everything out cleanly
          console.log(`[Fetchio]: query ${method}: ${url.toString()} with data`, {
              body: loggedBody,
              param: validatedParam,
              query: validatedQuery,
          });
      }

    const headers: Record<string, string> = {};


    if (!(validatedBody instanceof FormData)) {

      headers['Content-Type'] = 'application/json';
    }
    headers['credentials'] = 'include';

    const response = await fetchData(url.toString(), {
      method,
      body: validatedBody
        ? validatedBody instanceof FormData
          ? validatedBody
          : JSON.stringify(validatedBody)
        : undefined,
      ...(isPdf ? { responseType: 'arraybuffer' } : {}),
      signal,
      headers,
    });

    if (isStream) {
      // Return the raw Response — caller will read the stream
      return response as unknown as TResponse;
    }
    if (isPdf) {
        console.log("pdf kaze")
        console.log((await response.blob()));
      // Return PDF as blob casted to TResponse
      return (await response.blob()) as unknown as TResponse;
    }

    if (isCompleteResponse) {
      // Return entire response casted to TResponse (usually not recommended, but you control usage)
      return response as unknown as TResponse;
    }

    if (!responseSchema) {
      throw new Error('[Fetchio]: No response schema defined to validate response.');
    }

    const jsonResponse = await response.json();

    const validatedResponse = responseSchema.parse(jsonResponse);

    if (options?.debug) {
      console.log(`[Fetchio]: response from ${endpointUrl}`, validatedResponse);
    }

    return validatedResponse;
  } catch (error) {
    if (options?.debug && error instanceof ZodError) {
      console.error(
        '[Fetchio]: invalid response schema:',
        JSON.stringify(error.flatten().fieldErrors, null, 2),
        error
      );
    }
    throw error;
  }
}
