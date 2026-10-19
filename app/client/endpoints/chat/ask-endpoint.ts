import type { FetchioEndpoint } from '../types';
import {askModel, type AskModel} from "~/validators/chat";
import {type GetIdResponse, responseId} from "~/client/validators";
import {chatResponse, type ChatResponse} from "~/validators/chat/ask";

const chatAskEndpoint: FetchioEndpoint<ChatResponse, AskModel> = {
    method: 'POST',
    url: '/ask',
    responseSchema: chatResponse,
    requestBodySchema: askModel,
};

export { chatAskEndpoint };