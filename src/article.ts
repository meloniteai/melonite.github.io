import './typography.ts';
import './styles.css';
import { bindPlaceholderLinks } from './navigation.ts';

// Article content is already in the generated HTML and needs no client router.
const unbind = bindPlaceholderLinks(document);
if (import.meta.hot) import.meta.hot.dispose(unbind);
