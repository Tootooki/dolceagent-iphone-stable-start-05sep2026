// Let CSS own normal mobile geometry from the first paint. A transient first
// visualViewport sample must not replace 100dvh or move the whole app.
// VisualViewport is still needed while a text keyboard pans/shrinks the view.
(() => {
  const root = document.documentElement;
  const mobile = window.matchMedia('(max-width: 899px)');
  const viewport = window.visualViewport;
  const nativeHeight = Boolean(window.CSS?.supports?.('height', '100dvh'));
  const properties = ['--app-viewport-top', '--app-viewport-left', '--app-viewport-height', '--app-viewport-width'];
  const originalRestoration = window.history?.scrollRestoration;
  const timers = new Set();
  let frame = 0;

  const positive = (...values) => values.find(value => Number.isFinite(value) && value > 0) || 1;
  const editable = () => {
    const element = document.activeElement;
    return Boolean(element?.isContentEditable || element?.tagName === 'TEXTAREA' ||
      element?.tagName === 'INPUT' && !['button','submit','reset','checkbox','radio','range','color','file','hidden','image'].includes(element.type));
  };
  const clear = property => { if (root.style.getPropertyValue(property)) root.style.removeProperty(property); };
  const set = (property, value) => {
    const next = Math.round(Math.max(0, value) * 100) / 100 + 'px';
    if (root.style.getPropertyValue(property) !== next) root.style.setProperty(property, next);
  };
  const sync = () => {
    frame = 0;
    if (document.visibilityState === 'hidden') return;
    // Only the outer document is pinned. Sheet/menu/chat scroll positions are
    // separate and are never reset here, including on back/forward navigation.
    if (window.history && originalRestoration !== undefined) {
      const restoration = mobile.matches ? 'manual' : originalRestoration;
      if (window.history.scrollRestoration !== restoration) window.history.scrollRestoration = restoration;
    }
    if (!mobile.matches) {
      properties.forEach(clear);
    } else {
      const typing = editable();
      const layoutHeight = positive(window.innerHeight, root.clientHeight);
      const layoutWidth = positive(window.innerWidth, root.clientWidth);
      const height = Math.min(positive(viewport?.height, layoutHeight), layoutHeight);
      const width = Math.min(positive(viewport?.width, layoutWidth), layoutWidth);
      if (typing) {
        // Some iPhone webviews shrink innerHeight with the keyboard while
        // retaining a genuine visual pan. Do not infer a zero pan from that.
        const offset = value => Number.isFinite(value) ? Math.max(0, value) : 0;
        const bounds = [offset(viewport?.offsetTop), offset(viewport?.offsetLeft), height, width];
        bounds.forEach((value, index) => set(properties[index], value));
      } else {
        properties.filter(property => nativeHeight || property !== '--app-viewport-height').forEach(clear);
        // Old browsers without dvh get a bounded, resampled height fallback;
        // transient browser-chrome offsets never reposition the normal shell.
        if (!nativeHeight) set('--app-viewport-height', height);
        const keyboardClosing = layoutHeight - height > 150;
        const magnified = Number.isFinite(viewport?.scale) && Math.abs(viewport.scale - 1) > 0.01;
        if (!keyboardClosing && !magnified && (Math.abs(window.scrollX || 0) > 0.5 || Math.abs(window.scrollY || 0) > 0.5)) {
          window.scrollTo(0, 0);
        }
      }
    }
    window.dispatchEvent(new Event('dolce:viewportchange'));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
  const cancelSettling = () => { timers.forEach(id => window.clearTimeout(id)); timers.clear(); };
  const settle = () => {
    cancelSettling();schedule();
    // First navigation, tab restoration and keyboard dismissal may settle
    // after their initial event. These checks end; there is no polling loop.
    if (!mobile.matches || document.visibilityState === 'hidden') return;
    for (const delay of [100, 350, 1000]) {
      const id = window.setTimeout(() => { timers.delete(id); schedule(); }, delay);timers.add(id);
    }
  };

  viewport?.addEventListener('resize', schedule, {passive: true});
  viewport?.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('pageshow', settle);
  window.addEventListener('load', settle);
  window.addEventListener('orientationchange', settle);
  document.addEventListener('visibilitychange', settle);
  document.addEventListener('dolce:menu-ready', settle);
  document.addEventListener('focusin', settle);
  document.addEventListener('focusout', settle);
  mobile.addEventListener('change', settle);
  window.addEventListener('pagehide', () => {
    cancelSettling();if (frame) window.cancelAnimationFrame(frame);frame=0;
  });
  sync();settle();
})();
