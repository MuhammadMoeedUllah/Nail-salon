<script lang="ts">
  import { toaster, dismissToast } from './toast.svelte';
  import { IconDone, IconInfo, IconUndo, IconClose } from './icons';
  let { undoLabel = 'Undo', closeLabel = 'Close', withNav = true }: { undoLabel?: string; closeLabel?: string; withNav?: boolean } = $props();
  let busy = $state(false);
  async function undo() {
    const t = toaster.current;
    if (!t?.undo || busy) return;
    busy = true;
    try {
      await t.undo();
    } finally {
      busy = false;
      dismissToast();
    }
  }
</script>

<div aria-live="polite" class="no-print pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-3 {withNav ? 'bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-6' : 'bottom-6'}">
  {#if toaster.current}
    {@const t = toaster.current}
    {#key t.id}
      <div class="pointer-events-auto relative flex w-full max-w-md animate-fade-up items-center gap-3 overflow-hidden rounded-2xl bg-night py-2 pr-2 pl-4 text-white shadow-float" data-testid="toast">
        {#if t.kind === 'ok'}<IconDone size={22} class="shrink-0 text-emerald-300" />{:else}<IconInfo size={22} class="shrink-0 text-sky-300" />{/if}
        <p class="min-w-0 flex-1 py-2 text-base leading-snug font-bold">{t.text}</p>
        {#if t.undo}
          <button type="button" class="btn min-h-11 rounded-lg bg-white/10 px-3 text-base text-white hover:bg-white/20" onclick={undo} disabled={busy}><IconUndo size={18} strokeWidth={2.5} />{undoLabel}</button>
        {/if}
        <button type="button" class="btn size-11 shrink-0 rounded-lg !p-0 text-white/80 hover:bg-white/10" aria-label={closeLabel} onclick={dismissToast}><IconClose size={20} /></button>
        <span class="absolute bottom-0 left-0 h-1 bg-white/40" style="animation: toast-life {t.duration}ms linear forwards"></span>
      </div>
    {/key}
  {/if}
</div>

<style>
  @keyframes toast-life { from { width: 100%; } to { width: 0%; } }
</style>
