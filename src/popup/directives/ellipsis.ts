import { Accessor, onMount } from "solid-js";

/**
 * Adds an ellipsis when the text is too long to be shown on a single line
 * and shows the full text in a native browser tooltip.
 * The user of the directive has to make sure the element has a defined
 * width/max-width or use flexbox to help.
 * https://leonardofaria.net/2020/07/18/using-flexbox-and-text-ellipsis-together
 */
export function singleLineEllipsis(
  htmlElement: HTMLElement,
  fullText: Accessor<string>,
) {
  htmlElement.style.overflow = "hidden";
  htmlElement.style.textOverflow = "ellipsis";
  htmlElement.style.whiteSpace = "nowrap";
  onMount(() => {
    if (htmlElement.scrollWidth > htmlElement.clientWidth) {
      htmlElement.setAttribute("title", fullText());
    }
  });
}

declare module "solid-js" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      singleLineEllipsis: string;
    }
  }
}
