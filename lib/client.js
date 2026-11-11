window.__ModuleLoader__.load({
  id: '@elsebit/dsh-ikuncode-usage',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef, useCallback } = React;
    function Card() {
      const [data, setData] = useState(null);
      const sequence = useRef(0);
      const active = useRef(true);
      const refresh = useCallback(async () => {
        const ticket = ++sequence.current;
        // Clear the old amount while loading: a failed refresh must not look like a current balance.
        setData(null);
        try {
          const response = await fetch('/api/elsebit-ikuncode-usage', { cache: 'no-store', signal: AbortSignal.timeout(35000) });
          if (!response.ok) throw new Error();
          const body = await response.json();
          if (active.current && sequence.current === ticket) setData(body);
        } catch {
          if (active.current && sequence.current === ticket) setData({ ok: false, message: 'Query failed' });
        }
      }, []);
      useEffect(() => {
        active.current = true;
        refresh();
        const timer = setInterval(() => { if (document.visibilityState !== 'hidden') refresh(); }, 60000);
        return () => { active.current = false; sequence.current++; clearInterval(timer); };
      }, [refresh]);
      const total = data?.ok && typeof data.balance?.total === 'number' && Number.isFinite(data.balance.total) ? data.balance.total : null;
      return h('button', {
        type: 'button', onClick: refresh,
        title: data?.ok ? 'IKunCode - Click to refresh' : data?.message || 'Loading',
        'aria-label': 'IKunCode balance, click to refresh',
        style: { width: '100%', flex: '1 0 100%', boxSizing: 'border-box', textAlign: 'left', marginTop: 4, padding: '8px 10px', borderRadius: 10,
          border: '1px solid var(--dsw-border, #8884)', background: 'var(--dsw-bg, transparent)', color: 'inherit', cursor: 'pointer', minWidth: 0 },
      },
      h('div', { style: { fontSize: 11, lineHeight: '16px', opacity: 0.7, fontWeight: 600 } }, 'IKunCode'),
      h('div', { style: { fontSize: 21, lineHeight: '28px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' } }, total === null ? '¥ —' : '¥ ' + total.toFixed(2)),
      !data?.ok && data?.message ? h('div', { style: { fontSize: 11, lineHeight: '16px', overflowWrap: 'anywhere' } }, data.message) : null);
    }
    return {
      name: 'elsebit-ikuncode-usage-client', inject: ['slots'],
      apply(ctx) {
        const style = document.createElement('style');
        style.textContent = '[class*="footerActions"]{flex-wrap:wrap}';
        ctx.effect(() => { document.head.appendChild(style); return () => style.remove(); }, 'IKunCode card layout');
        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
          { name: 'sidebar.footer.action', id: 'elsebit-ikuncode-card', order: 110, label: () => 'IKunCode' },
          () => h(Card),
        ));
      },
    };
  },
});
