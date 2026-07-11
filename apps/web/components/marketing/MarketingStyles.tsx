/**
 * Marketing-only CSS: extra keyframes, the `.mkt` token aliases (so prototype
 * copy that uses --accent-light / --accent-dark / --green-light etc. renders
 * unchanged), and the responsive data-attribute rules. Injected once by the
 * MarketingShell. This is a scoped <style> element, not a global stylesheet.
 */
export function MarketingStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
.mkt{
  --accent-light: var(--accentl);
  --accent-dark: var(--accentd);
  --accent-mid: var(--accentm);
  --green-light: var(--greenl);
  --amber-light: var(--amberl);
}
@keyframes lbpm-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@keyframes lbpm-pulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)}70%{box-shadow:0 0 0 6px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}
@keyframes lbpm-throb{0%,100%{filter:drop-shadow(0 0 14px rgba(74,143,214,.45)) drop-shadow(0 0 34px rgba(74,143,214,.28))}50%{filter:drop-shadow(0 0 26px rgba(74,143,214,.85)) drop-shadow(0 0 60px rgba(74,143,214,.55))}}
.lbpm-fade{animation:lbpm-up .5s ease both}
.mkt a{color:inherit}
.mkt input:focus-visible,.mkt button:focus-visible,.mkt a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:860px){
  .mkt [data-cols],.mkt [data-2col],.mkt [data-hero],.mkt [data-tiers]{grid-template-columns:1fr!important}
  .mkt [data-navlinks]{display:none!important}
  .mkt [data-mobilenav]{display:flex!important}
  .mkt [data-h1]{font-size:38px!important}
  .mkt [data-pad]{padding-left:20px!important;padding-right:20px!important}
  .mkt [data-row]{flex-direction:column!important;align-items:stretch!important}
}
@media (prefers-reduced-motion:reduce){
  .mkt [data-throb]{animation:none!important}
  .lbpm-fade{animation:none!important}
}
`,
      }}
    />
  );
}
