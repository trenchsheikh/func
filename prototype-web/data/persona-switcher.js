/* ==========================================================================
   Func. — data/persona-switcher.js
   Real-mode-only test harness: act as any seeded person or business, so
   both sides of every interaction (guest request, host accept/decline) can
   be exercised by one person. Absent entirely in demo mode — app.js only
   mounts this when window.PersonaSwitcher exists, and interactive.html is
   the only entry point that loads this file.
   ========================================================================== */
window.PersonaSwitcher = (function () {
  'use strict';

  function labelFor(id) {
    const p = STORE.getPerson(id); if (p) return p.name;
    const b = STORE.getBusiness(id); if (b) return b.name;
    return id;
  }

  function mount(phone, ctx, Screens) {
    const { h, Engine } = ctx;

    const chip = h('div', {
      style: { position: 'absolute', left: '14px', bottom: 'calc(190px + env(safe-area-inset-bottom))',
        zIndex: '30', padding: '8px 13px', borderRadius: '999px', maxWidth: '150px',
        background: 'rgba(10,16,21,.9)', boxShadow: 'inset 0 0 0 1px var(--hairline)',
        fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', color: 'var(--fg)' },
      onclick: openSwitcher,
    });
    function paintChip() { chip.textContent = 'Acting as ' + labelFor(STORE.getActivePersonaId()); }
    paintChip();
    phone.appendChild(chip);
    Engine.on('store:change', paintChip);
    STORE.on('persona', paintChip);

    function pendingCount(id) { return Engine.getPendingRequestsForHost(id).length; }

    function row(id, name) {
      const active = id === STORE.getActivePersonaId();
      const pending = pendingCount(id);
      return h('div', {
        class: 'card', style: { padding: '13px', display: 'flex', alignItems: 'center', gap: '11px',
          boxShadow: active ? 'inset 0 0 0 1.5px var(--em)' : 'inset 0 0 0 1px var(--hairline-2)' },
        onclick: () => {
          STORE.setActivePersona(id);
          Screens.closeSheet();
          paintChip();
        },
      }, [
        h('div', { class: 'grow' }, [
          h('div', { style: { fontWeight: '700', fontSize: '14.5px' }, text: name }),
          h('div', { class: 'small', style: { marginTop: '2px' }, text: active ? 'Currently acting as this persona' : 'Tap to act as this persona' }),
        ]),
        pending ? h('span', { class: 'chip on', style: { flex: 'none' }, text: pending + ' waiting' }) : null,
      ]);
    }

    function openSwitcher() {
      const people = STORE.listPeople().map(p => row(p.id, p.name + (p.id === 'you' ? ' (you)' : '')));
      const businesses = STORE.listBusinesses().map(b => row(b.id, b.name));
      Screens.openSheet(h('div', { class: 'pad' }, [
        h('h2', { class: 'd2', text: 'Act as' }),
        h('p', { class: 'body', style: { margin: '6px 0 16px' },
          text: 'Test both sides of a request without a second device — switch who you are, take the action, switch back.' }),
        h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'People' }),
        h('div', { class: 'gap', style: { marginBottom: '18px' } }, people),
        h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Businesses' }),
        h('div', { class: 'gap', style: { marginBottom: '18px' } }, businesses),
        h('button', { class: 'btn ghost', text: 'Reset demo data', onclick: () => {
          STORE.resetDemoData(); Screens.closeSheet(); paintChip();
        } }),
      ]), { tall: true, onChange: openSwitcher });
    }
  }

  return { mount };
})();
