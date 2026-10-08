<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Dialog } from 'bits-ui';
  import { IconClose } from './icons';
  // Bottom sheet on phones and tablets in portrait, centred dialog from 1024 px. Focus is trapped and restored by Bits UI.
  let { open = $bindable(false), title, description, closeLabel = 'Close', wide = false, children, footer, onclose }: { open?: boolean; title: string; description?: string; closeLabel?: string; wide?: boolean; children?: Snippet; footer?: Snippet; onclose?: () => void } = $props();
</script>

<Dialog.Root bind:open onOpenChange={(o) => { if (!o) onclose?.(); }}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-[1px]" />
    <Dialog.Content
      class="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-surface shadow-float outline-none lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[88dvh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl {wide ? 'lg:w-[min(860px,94vw)]' : 'lg:w-[min(560px,92vw)]'} animate-fade-up"
    >
      <div class="shrink-0 border-b border-line px-4 pt-2 pb-3 sm:px-5">
        <div class="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line lg:hidden" aria-hidden="true"></div>
        <div class="flex items-center justify-between gap-3">
          <Dialog.Title class="text-xl leading-tight font-bold">{title}</Dialog.Title>
          <Dialog.Close class="btn btn-ghost size-12 shrink-0 !p-0" aria-label={closeLabel}><IconClose size={24} /></Dialog.Close>
        </div>
        {#if description}<Dialog.Description class="mt-1 text-base text-ink-muted">{description}</Dialog.Description>{/if}
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{@render children?.()}</div>
      {#if footer}<div class="shrink-0 border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">{@render footer()}</div>{/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
