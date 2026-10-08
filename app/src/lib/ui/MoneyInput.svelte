<script lang="ts">
  // Dollars as text with a decimal keypad (R21). Values are parsed to cents on the server with parseDollars.
  let { value = $bindable(''), name, id, required = false, placeholder = '0.00', align = 'right', class: cls = '', ...rest }: { value?: string; name?: string; id?: string; required?: boolean; placeholder?: string; align?: 'left' | 'right'; class?: string; [key: string]: unknown } = $props();
</script>

<div class="relative">
  <span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base font-bold text-ink-muted" aria-hidden="true">$</span>
  <input
    {id}
    {name}
    type="text"
    inputmode="decimal"
    autocomplete="off"
    enterkeyhint="done"
    pattern={'^\\$?[0-9,]{0,7}([.][0-9]{0,2})?$'}
    class="input pl-8 tabular-nums {align === 'right' ? 'text-right' : ''} {cls}"
    bind:value
    {required}
    {placeholder}
    {...rest}
  />
</div>
