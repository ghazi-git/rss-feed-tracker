import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const DeleteNodeContext = createContext<{
  store: DeleteNodeStore;
  openModal: OpenModalType;
  closeModal: CloseModalType;
}>();

export function DeleteNodeProvider(props: FlowProps) {
  const [store, setStore] = createStore<DeleteNodeStore>({
    open: false,
    nodeId: null,
    modalTitle: "",
    modalText: "",
  });
  const openModal: OpenModalType = (id, title, text) => {
    setStore({
      open: true,
      nodeId: id,
      modalTitle: title,
      modalText: text,
    });
  };
  const closeModal: CloseModalType = () => {
    setStore("open", false);
  };

  return (
    <DeleteNodeContext.Provider value={{ store, openModal, closeModal }}>
      {props.children}
    </DeleteNodeContext.Provider>
  );
}

export function useDeleteNodeContext() {
  const context = useContext(DeleteNodeContext);
  if (!context) {
    throw new Error("useDeleteNodeContext: cannot find DeleteNodeContext");
  }
  return context;
}

interface DeleteNodeStore {
  open: boolean;
  nodeId: number | null;
  modalTitle: string;
  modalText: string;
}

type OpenModalType = (
  id: number,
  modalTitle: string,
  modalText: string,
) => void;

type CloseModalType = () => void;
