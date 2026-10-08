<script lang="ts">
  import { initials, hue } from './avatar';
  let { name, id, size = 40, class: cls = '' }: { name: string; id?: string; size?: number; class?: string } = $props();
</script>

<span
  aria-hidden="true"
  class="inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold leading-none text-white {cls}"
  style="width:{size}px;height:{size}px;background:{hue(id ?? name)};font-size:{Math.round(size * 0.4)}px"
>{initials(name)}</span>
