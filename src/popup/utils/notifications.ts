import { dismissToast, showToast, ToastOptions } from "solid-notifications";

import styles from "./notifications.module.css";

export function notifySuccess(msg: string, options?: ToastOptions) {
  let opts: ToastOptions = {
    class: `sn-toast ${styles.success}`,
    duration: 3000,
  };
  if (options) {
    opts = { ...opts, ...options };
  }

  dismissToast();
  return showToast(msg, opts);
}

export function notifyError(msg: string, options?: ToastOptions) {
  let opts: ToastOptions = { class: `sn-toast ${styles.error}` };
  if (options) {
    opts = { ...opts, ...options };
  }

  dismissToast();
  return showToast(msg, opts);
}

export function notifyInfo(msg: string, options?: ToastOptions) {
  let opts: ToastOptions = { class: `sn-toast ${styles.info}`, duration: 3000 };
  if (options) {
    opts = { ...opts, ...options };
  }

  dismissToast();
  return showToast(msg, opts);
}
