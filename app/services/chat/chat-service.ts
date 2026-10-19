import type {AskModel} from "~/validators/chat";
import {getClient} from "~/client/api-client";
import {query} from "~/client/core";
import {chatAskEndpoint} from "~/client/endpoints";

const client = getClient()

const askMethod = (model: AskModel, signal?: AbortSignal) =>
    query<Response, AskModel>(
        client,
        chatAskEndpoint,
        { body: model },
        signal,
        false,   // isPdf
        false,   // isCompleteResponse
        true     // isStream
    );

export {
    askMethod,
};
