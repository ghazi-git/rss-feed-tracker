import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const DeleteNodeContext = createContext();

export function DeleteNodeProvider(props) {
  const [store, setStore] = createStore({
    open: false,
    nodeId: null,
    modalTitle: "",
    modalText: "",
  });
  const openModal = (id, title, text) => {
    setStore({
      open: true,
      nodeId: id,
      modalTitle: title,
      modalText: text,
    });
  };
  const closeModal = () => {
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
