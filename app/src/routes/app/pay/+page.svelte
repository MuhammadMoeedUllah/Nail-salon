<script lang="ts">
  import { makeT } from '$lib/i18n';
  import { fmtCents, fmtDate, fmtMinutes } from '$lib/time';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import StatusPill from '$lib/ui/StatusPill.svelte';
  import DataTable from '$lib/ui/DataTable.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import { IconOwed, IconDone, IconNext, IconPay, IconApprove, IconPaid, IconEdit, IconToday, IconMessage } from '$lib/ui/icons';
  let { data } = $props();
  const t = $derived(makeT(data.locale));
  const L = $derived(data.locale);
  type Row = (typeof data.rows)[number];
  const statusOf = (r: Row) =>
    r.status === 'paid'
      ? { kind: 'ok' as const, icon: IconPaid, text: t('pay_status_paid') }
      : r.status === 'approved'
        ? { kind: 'info' as const, icon: IconApprove, text: t('pay_status_approved') }
        : r.current
          ? { kind: 'brand' as const, icon: IconToday, text: t('py_current') }
          : { kind: 'neutral' as const, icon: IconEdit, text: t('pay_status_draft') };
  const range = (r: Row) => `${fmtDate(r.periodStart, L)} – ${fmtDate(r.periodEnd, L)}`;
</script>

<svelte:head><title>{t('pay_title')}</title></svelte:head>

<PageHeader title={t('pay_title')} subtitle={t('owed_by_law_hint')} />

{#if data.rows.length === 0}
  <div class="card"><EmptyState icon={IconPay} title={t('pay_title')} text={t('py_no_weeks')} /></div>
{:else}
  <ul class="space-y-3 md:hidden">
    {#each data.rows as r (r.periodStart)}
      {@const st = statusOf(r)}
      <li>
        <a href="/app/pay/{r.periodStart}" class="card block p-4 hover:bg-sunken">
          <span class="flex items-start justify-between gap-2">
            <span>
              <span class="block text-lg leading-tight font-bold">{range(r)}</span>
              <span class="mt-0.5 block text-sm text-ink-muted">{t('py_techs', { n: r.workers })} · {fmtMinutes(r.minutes)} h</span>
            </span>
            <StatusPill kind={st.kind} icon={st.icon}>{st.text}</StatusPill>
          </span>
          <span class="mt-3 flex flex-wrap items-end justify-between gap-2">
            <span><span class="block text-sm text-ink-muted">{t('total_pay')}</span><span class="block text-xl font-bold">{fmtCents(r.total)}</span></span>
            {#if r.owed > 0}<StatusPill kind="owed" icon={IconOwed}>{t('py_owed_pill', { amount: fmtCents(r.owed) })}</StatusPill>{:else}<StatusPill kind="ok" icon={IconDone}>{t('py_none_owed')}</StatusPill>{/if}
          </span>
          {#if r.status === 'paid'}
            <span class="mt-2 flex items-center gap-1.5 text-sm font-bold {r.sent < r.lines ? 'text-warn-ink' : 'text-ok-ink'}"><IconMessage size={16} />{t('py_sent_count', { sent: r.sent, total: r.lines })}</span>
          {/if}
        </a>
      </li>
    {/each}
  </ul>

  <div class="hidden md:block">
    <DataTable caption={t('pay_title')}>
      <thead>
        <tr>
          <th>{t('pay_week')}</th>
          <th>{t('py_status')}</th>
          <th class="num">{t('nav_workers')}</th>
          <th class="num">{t('hours')}</th>
          <th class="num">{t('gross_wages')}</th>
          <th class="num">{t('owed_by_law')}</th>
          <th class="num">{t('total_pay')}</th>
          <th><span class="sr-only">{t('pay_open')}</span></th>
        </tr>
      </thead>
      <tbody>
        {#each data.rows as r (r.periodStart)}
          {@const st = statusOf(r)}
          <tr class="hover:bg-sunken">
            <td><a href="/app/pay/{r.periodStart}" class="font-bold text-brand-strong underline decoration-brand-tint decoration-2 underline-offset-4">{range(r)}</a></td>
            <td>
              <StatusPill kind={st.kind} icon={st.icon}>{st.text}</StatusPill>
              {#if r.status === 'paid'}<span class="mt-1 block text-sm {r.sent < r.lines ? 'text-warn-ink' : 'text-ink-muted'}">{t('py_sent_count', { sent: r.sent, total: r.lines })}</span>{/if}
            </td>
            <td class="num">{r.workers}</td>
            <td class="num">{fmtMinutes(r.minutes)}</td>
            <td class="num">{fmtCents(r.gross)}</td>
            <td class="num">{#if r.owed > 0}<span class="inline-flex items-center gap-1 font-bold text-owed"><IconOwed size={16} />{fmtCents(r.owed)}</span>{:else}<span class="text-ink-muted">—</span>{/if}</td>
            <td class="num font-bold">{fmtCents(r.total)}</td>
            <td class="w-14"><a href="/app/pay/{r.periodStart}" class="btn-secondary size-11 !p-0" aria-label="{t('pay_open')} {range(r)}"><IconNext size={20} /></a></td>
          </tr>
        {/each}
      </tbody>
    </DataTable>
  </div>
{/if}
