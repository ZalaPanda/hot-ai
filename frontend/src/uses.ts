import type { TransitionConfig, EasingFunction } from 'svelte/types/runtime/transition';

export interface TypewriterParams {
  speed?: number;
  easing?: EasingFunction;
};

/**
 * The typewriter transition will give your text a typed effect. Just like every other transition, it is triggered by an element entering or leaving the DOM as a result of a state change. If you attempt to use the typewriter transition on non text nodes, it will result in an error.
 *
 * ```tsx
 * <div transition:typewriter>Will be typed out</div>
 * <div transition:typewriter={{speed: 0.3}}>Will be typed out slower</div>
 * <div transition:typewriter={{speed: 2.5}}>Will be typed out faster</div>
 * ```
 *
 * @param params Optional params to pass to the transition
 * @see https://svelteui.org/motion/typewriter
 */
export const typewriter = (node: HTMLElement, { speed = 1.2, easing }: TypewriterParams): TransitionConfig => {
  const isSingleTextNode = node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE;

  if (!isSingleTextNode) {
    throw new Error(`This transition only works on elements with a single text node child`);
  }

  const text = node.textContent;
  const duration = text.length / (speed * 0.01);

  return {
    easing,
    duration,
    tick: (t) => {
      const i = ~~(text.length * t);
      node.textContent = text.slice(0, i);
    }
  };
};

export interface FlipboardParams {
  delay?: number;
  duration?: number;
  easing?: EasingFunction;
  css?: (t: number, u: number) => string;
  tick?: (t: number, u: number) => void;
};

/**
 * The flipboard transition that displays text with a glitch like effect. Just like every other transition, it is triggered by an element entering or leaving the DOM as a result of a state change. If you attempt to use the flipboard transition on non text nodes, it will result in an error.
 *
 * ```tsx
 * <div transition:flipboard>Will be typed out</div>
 * ```
 *
 * @param params Optional params to pass to the transition
 * @see https://svelteui.org/motion/flipboard
 */
export const flipboard = (node: HTMLElement, { delay = 0, duration = 400, easing }: FlipboardParams): TransitionConfig => {
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  const text = node.textContent.trim();

  let lastTime = 0;

  return {
    delay,
    duration,
    easing,
    tick(t) {
      if (t === 1) {
        node.textContent = text;
        return;
      }

      const now = Date.now();
      if (now - lastTime < 32) return;
      lastTime = now;

      let str = '';
      for (let i = 0; i < text.length; i++) {
        const progress = i / text.length;
        if (text[i] === ' ' || progress < t * 0.9) {
          str += text[i];
        } else if (progress < t * 1.5) {
          str += randomChars[Math.floor(Math.random() * randomChars.length)];
        } else if (progress < t * 2) {
          str += '-';
        } else {
          str += ' ';
        }
      }
      node.textContent = str;
    }
  };
};

export const focusTrap = (node: HTMLElement, enabled: boolean) => {
  const elemWhitelist = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
  let elemFirst: HTMLElement;
  let elemLast: HTMLElement;

  // When the first element is selected, shift+tab pressed, jump to the last selectable item.
  const onFirstElemKeydown = (e: KeyboardEvent): void => {
    if (e.shiftKey && e.code === 'Tab') {
      e.preventDefault();
      elemLast.focus();
    }
  }

  // When the last item selected, tab pressed, jump to the first selectable item.
  const onLastElemKeydown = (e: KeyboardEvent): void => {
    if (!e.shiftKey && e.code === 'Tab') {
      e.preventDefault();
      elemFirst.focus();
    }
  }

  const onInit = () => {
    if (enabled === false) return;
    // Gather all focusable elements
    const focusableElems: HTMLElement[] = Array.from(node.querySelectorAll(elemWhitelist));
    if (focusableElems.length) {
      // Set first/last focusable elements
      elemFirst = focusableElems[0];
      elemLast = focusableElems[focusableElems.length - 1];
      // Auto-focus first focusable element
      elemFirst.focus();
      // Listen for keydown on first & last element
      elemFirst.addEventListener('keydown', onFirstElemKeydown);
      elemLast.addEventListener('keydown', onLastElemKeydown);
    }
  };
  onInit();

  const onDestory = (): void => {
    if (elemFirst) elemFirst.removeEventListener('keydown', onFirstElemKeydown);
    if (elemLast) elemLast.removeEventListener('keydown', onLastElemKeydown);
  };

  // Lifecycle
  return {
    update: (newArgs: boolean) => {
      enabled = newArgs;
      newArgs ? onInit() : onDestory();
    },
    destroy: () => {
      onDestory();
    }
  };
};

export type Action<T = any> = (
  node: HTMLElement,
  parameters?: T
) => {
  update?: (parameters: T) => any | void;
  destroy?: () => void;
};

/**
 * With the `use-click-outside` action, a callback function will be fired whenever the user clicks outside of the dom node the action is applied to.
 *
 * ```tsx
 * <script>
 *     import { clickoutside } from '@svelteuidev/actions'
 *
 *     let open = true;
 * </script>
 *
 * <div use:clickoutside={{ enabled: open, callback: () => open = false }}>
 *
 *     <Button on:click={() => open = true}>Open Modal</Button>
 *
 *     {#if open}
 *         <div>
 *             This is a modal
 *         </div>
 *     {:else if !open}
 *         <div>
 *             There is no modal
 *         </div>
 *    {/if}
 * </div>
 * ```
 * @param params - Object that contains two properties {enabled: boolean, callback: (any) => unknown}
 * @see https://svelteui.org/actions/use-click-outside
 */
export const clickoutside = (
  node: HTMLElement,
  params: { enabled: boolean; callback: (any) => unknown }
): ReturnType<Action> => {
  const { enabled: initialEnabled, callback } = params;

  const handleOutsideClick = ({ target }: MouseEvent) => {
    if (!node.contains(target as Node)) callback(node); // typescript hack, not sure how to solve without asserting as Node
  };

  const update = ({ enabled }: { enabled: boolean }) => {
    if (enabled) window.addEventListener('click', handleOutsideClick);
    else window.removeEventListener('click', handleOutsideClick);
  }
  update({ enabled: initialEnabled });
  return {
    update,
    destroy: () => {
      window.removeEventListener('click', handleOutsideClick);
    }
  };
};