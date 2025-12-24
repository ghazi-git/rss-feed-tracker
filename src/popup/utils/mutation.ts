import { createStore } from "solid-js/store";

import {
  MessageData,
  MessagePayload,
  MessageType,
  sendMessage,
} from "@/messaging-wrapper";

export function createMutation<K extends MessageType>(messageType: K) {
  const [mutation, setStore] = createStore<Mutation<K>>({
    status: "idle",
    data: null,
    errorMsg: null,
    isIdle: true,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  async function sendMsg(payload: MessagePayload<K>) {
    setStore({
      status: "loading",
      data: null,
      errorMsg: null,
      isIdle: false,
      isLoading: true,
      isSuccess: false,
      isError: false,
    });
    const response = await sendMessage(messageType, payload);
    if (response.success) {
      setStore({
        status: "success",
        data: response.data,
        errorMsg: null,
        isIdle: false,
        isLoading: false,
        isSuccess: true,
        isError: false,
      });
    } else {
      setStore({
        status: "error",
        data: null,
        errorMsg: response.errorMsg,
        isIdle: false,
        isLoading: false,
        isSuccess: false,
        isError: true,
      });
    }
  }
  function reset() {
    setStore({
      status: "idle",
      data: null,
      errorMsg: null,
      isIdle: true,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }

  return { mutation, sendMsg, reset };
}

interface MutationIdle {
  status: "idle";
  data: null;
  errorMsg: null;
  isIdle: true;
  isLoading: false;
  isSuccess: false;
  isError: false;
}

interface MutationLoading {
  status: "loading";
  data: null;
  errorMsg: null;
  isIdle: false;
  isLoading: true;
  isSuccess: false;
  isError: false;
}

interface MutationSuccess<K extends MessageType> {
  status: "success";
  data: MessageData<K>;
  errorMsg: null;
  isIdle: false;
  isLoading: false;
  isSuccess: true;
  isError: false;
}

interface MutationError {
  status: "error";
  data: null;
  errorMsg: string;
  isIdle: false;
  isLoading: false;
  isSuccess: false;
  isError: true;
}

type Mutation<K extends MessageType> =
  | MutationIdle
  | MutationLoading
  | MutationSuccess<K>
  | MutationError;
