import type { UseMutationOptions } from '@tanstack/react-query';
import type {GetIdResponse} from "~/client/validators";
import type {AskModel} from "~/validators/chat";
import {askMethod} from "~/services/chat/chat-service";
import type {ChatResponse} from "~/validators/chat/ask";

export const chatAskMutation: UseMutationOptions<ChatResponse, Error, { data: AskModel }> = {
    mutationFn: ({ data }) => askMethod(data)
};

