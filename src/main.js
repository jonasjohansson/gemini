// Version router
const params = new URLSearchParams(window.location.search);
const version = params.get('v') || '4';

if (version === '1') {
  import('./v1/boot.js');
} else if (version === '2') {
  import('./v2/boot.js');
} else if (version === '3') {
  import('./v3/boot.js');
} else {
  import('./v4/boot.js');
}
