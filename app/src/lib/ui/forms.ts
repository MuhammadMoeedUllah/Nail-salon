import type { SubmitFunction } from '@sveltejs/kit';

/**
 * Wrap a use:enhance SubmitFunction so the pressed button shows a pending state (R11):
 * aria-busy at once, a spinner after 300 ms, and the button cannot be pressed twice.
 */
export function busy(fn?: SubmitFunction): SubmitFunction {
  return async (input) => {
    const btn = (input.submitter as HTMLButtonElement | null) ?? input.formElement.querySelector<HTMLButtonElement>('button[type=submit],button:not([type])');
    const wasDisabled = btn?.disabled ?? false;
    btn?.setAttribute('aria-busy', 'true');
    const t = setTimeout(() => btn?.setAttribute('data-pending', ''), 300);
    if (btn) btn.disabled = true;
    const done = () => {
      clearTimeout(t);
      btn?.removeAttribute('data-pending');
      btn?.removeAttribute('aria-busy');
      if (btn) btn.disabled = wasDisabled;
    };
    const cancel = input.cancel;
    input.cancel = () => {
      done();
      cancel();
    };
    let after: Awaited<ReturnType<SubmitFunction>>;
    try {
      after = await fn?.(input);
    } catch (e) {
      done();
      throw e;
    }
    return async (opts) => {
      done();
      if (typeof after === 'function') await after(opts);
      else await opts.update();
    };
  };
}
