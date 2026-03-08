// Version router
const params = new URLSearchParams(window.location.search);
const version = params.get('v') || '2';

if (version === '1') {
  import('./v1/boot.js');
} else {
  import('./v2/boot.js');
}
