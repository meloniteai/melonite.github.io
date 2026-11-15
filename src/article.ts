import './typography.ts';
import './styles.css';
import './solver-desktop.css';
import { bindPlaceholderLinks } from './navigation.ts';
import { bindArticleNavigation } from './article-navigation.ts';

// Article content is already in the generated HTML and needs no client router.
const unbind = bindPlaceholderLinks(document);
const unbindArticleNavigation = bindArticleNavigation();
let disposeCharts: (() => void) | undefined;
let disposeDesktop: (() => void) | undefined;
let disposed = false;
if (document.querySelector('[data-solver-desktop]')) {
  void import('./solver-desktop.ts').then(({ mountSolverDesktop }) => {
    if (!disposed) disposeDesktop = mountSolverDesktop();
  }).catch((error: unknown) => console.error('Could not load the solver desktop.', error));
}
if (document.querySelector('[data-benchmark-chart]')) {
  void import('./benchmark-charts.ts').then(async ({ mountBenchmarkCharts }) => {
    if (disposed) return;
    const cleanup = await mountBenchmarkCharts();
    if (disposed) cleanup();
    else disposeCharts = cleanup;
  }).catch((error: unknown) => {
    console.error('Could not load benchmark charts.', error);
    document.querySelectorAll('.chart-loading').forEach((node) => {
      node.textContent = 'The interactive chart could not load. All values remain available in the data table below.';
    });
  });
}
if (import.meta.hot) import.meta.hot.dispose(() => {
  disposed = true;
  disposeCharts?.();
  disposeDesktop?.();
  unbind();
  unbindArticleNavigation();
});
