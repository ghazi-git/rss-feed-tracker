import { showToast, ToastOptions } from "solid-notifications";

import styles from "./notifications.module.css";

export function notifySuccess(msg: string, options?: ToastOptions) {
  let opts: ToastOptions = { class: `sn-toast ${styles.success}` };
  if (options) {
    opts = { ...opts, ...options };
  }

  return showToast(msg, opts);
}

export function notifyError(msg: string, options?: ToastOptions) {
  let opts: ToastOptions = { class: `sn-toast ${styles.error}` };
  if (options) {
    opts = { ...opts, ...options };
  }

  return showToast(msg, opts);
}

export function notifyInfo(msg: string, options?: ToastOptions) {
  let opts: ToastOptions = { class: `sn-toast ${styles.info}` };
  if (options) {
    opts = { ...opts, ...options };
  }

  return showToast(msg, opts);
}
