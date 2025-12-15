import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const DeleteNodeContext = createContext<{
  store: DeleteNodeStore;
  openModal: OpenModalType;
}>();

export function DeleteNodeProvider(props: FlowProps) {
  const [store, setStore] = createStore<DeleteNodeStore>({
    nodeId: null,
    nodeType: null,
    modalText: null,
  });
  const openModal: OpenModalType = (id, type, text) => {
    setStore({
      nodeId: id,
      nodeType: type,
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

type DeleteNodeStore =
  | {
      nodeId: number;
      nodeType: "feed" | "folder";
      modalText: string;
    }
  | {
      nodeId: null;
      nodeType: null;
      modalText: null;
    };

type OpenModalType = (
  id: number,
  nodeType: "feed" | "folder",
  modalText: string,
) => void;
