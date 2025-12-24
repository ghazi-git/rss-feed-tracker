import { createStore } from "solid-js/store";

import {
  MessageData,
  MessagePayload,
  MessageType,
  sendMessage,
} from "@/messaging-wrapper";

/**
 * Note that:
 * - initial data must be the same type as the returned data to avoid accounting
 * for data being null (but the restriction can be removed if createQuery is
 * needed with initial data as null)
 * - successDataHandler can be used for accumulating posts across requests (as
 * the user loads more posts)
 * - old data is preserved on load/error
 * - if caching is needed, consider solid-query
 */
export function createQuery<K extends MessageType>(
  messageType: K,
  initialData: MessageData<K>,
  successDataHandler?: SuccessDataHandler<K>,
) {
  const [query, setQuery] = createStore<Query<MessageData<K>>>({
    status: "idle",
    data: initialData,
    errorMsg: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });
  const defaultSuccessDataHandler: SuccessDataHandler<K> = (oldData, newData) =>
    newData;
  const dataHandler = successDataHandler ?? defaultSuccessDataHandler;

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
      setQuery(({ data }) => ({
        status: "success",
        data: dataHandler(data, resp.data),
        errorMsg: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
      }));
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

  return { query, sendMsg };
}

type SuccessDataHandler<K extends MessageType> = (
  oldData: MessageData<K>,
  newData: MessageData<K>,
) => MessageData<K>;

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

export type Query<TData> =
  | QueryIdle<TData>
  | QueryLoading<TData>
  | QuerySuccess<TData>
  | QueryError<TData>;
