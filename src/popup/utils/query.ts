import { createStore } from "solid-js/store";

import {
  MessageData,
  MessagePayload,
  MessageType,
  sendMessage,
} from "@/messaging-wrapper";

export function createQuery<K extends MessageType>(
  messageType: K,
): {
  query: Query<MessageData<K> | null, MessageData<K>>;
  sendMsg: (payload: MessagePayload<K>) => Promise<void>;
  mutateData: (
    setterFunc: (oldValue: MessageData<K>) => MessageData<K>,
  ) => void;
};
export function createQuery<K extends MessageType>(
  messageType: K,
  initialValue: MessageData<K>,
): {
  query: Query<MessageData<K>, MessageData<K>>;
  sendMsg: (payload: MessagePayload<K>) => Promise<void>;
  mutateData: (
    setterFunc: (oldValue: MessageData<K>) => MessageData<K>,
  ) => void;
};
export function createQuery<K extends MessageType>(
  messageType: K,
  initialValue: MessageData<K> | null = null,
) {
  const [query, setQuery] = createStore<
    Query<MessageData<K> | null, MessageData<K>>
  >({
    status: "idle",
    data: initialValue,
    errorMsg: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  async function sendMsg(payload: MessagePayload<K>) {
    setQuery(({ data }) => ({
      status: "loading",
      data,
      errorMsg: null,
      isLoading: true,
      isSuccess: false,
      isError: false,
    }));
    const resp = await sendMessage(messageType, payload);
    if (resp.success) {
      setQuery({
        status: "success",
        data: resp.data,
        errorMsg: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
      });
    } else {
      setQuery(({ data }) => ({
        status: "error",
        data,
        errorMsg: resp.errorMsg,
        isLoading: false,
        isSuccess: false,
        isError: true,
      }));
    }
  }

  const mutateData = (
    setterFunc: (oldValue: MessageData<K>) => MessageData<K>,
  ) => {
    setQuery((oldValue) => {
      if (!oldValue.data) return oldValue;

      return { ...oldValue, data: setterFunc(oldValue.data) };
    });
  };
  return { query, sendMsg, mutateData };
}

interface QueryIdle<TData> {
  status: "idle";
  data: TData;
  errorMsg: null;
  isLoading: false;
  isSuccess: false;
  isError: false;
}

interface QueryLoading<TData> {
  status: "loading";
  data: TData;
  errorMsg: null;
  isLoading: true;
  isSuccess: false;
  isError: false;
}

interface QuerySuccess<TData> {
  status: "success";
  data: TData;
  errorMsg: null;
  isLoading: false;
  isSuccess: true;
  isError: false;
}

interface QueryError<TData> {
  status: "error";
  data: TData;
  errorMsg: string;
  isLoading: false;
  isSuccess: false;
  isError: true;
}

// separate success and other data types to ensure success data type does not
// include null even when the initial value is null
export type Query<TData, SuccessData> =
  | QueryIdle<TData>
  | QueryLoading<TData>
  | QuerySuccess<SuccessData>
  | QueryError<TData>;
