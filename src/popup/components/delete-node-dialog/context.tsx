import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const DeleteNodeContext = createContext<{
  store: DeleteNodeStore;
  openModal: OpenModalType;
}>();

export function DeleteNodeProvider(props: FlowProps) {
  const [store, setStore] = createStore<DeleteNodeStore>({
    nodeId: null,
    modalTitle: "",
    modalText: "",
  });
  const openModal: OpenModalType = (id, title, text) => {
    setStore({
      nodeId: id,
      modalTitle: title,
      modalText: text,
    });
    const dialog = document.getElementById(
      "delete-dialog",
    ) as HTMLDialogElement;
    dialog.showModal();
  };

  return (
    <DeleteNodeContext.Provider value={{ store, openModal }}>
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
  nodeId: number | null;
  modalTitle: string;
  modalText: string;
}

type OpenModalType = (
  id: number,
  modalTitle: string,
  modalText: string,
) => void;
