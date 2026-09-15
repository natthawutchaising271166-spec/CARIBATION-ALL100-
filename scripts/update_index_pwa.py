with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update <head> meta tags for complete PWA compliance
target_head = '<link rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png">'
new_head_meta = '''<link rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="./icons/icon-512x512.png">
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="QAP Control" />
    <meta name="application-name" content="Carrier QAP Calibration Control" />
    <meta name="msapplication-TileColor" content="#0f172a" />
    <meta name="msapplication-TileImage" content="./icons/icon-144x144.png" />'''

if target_head in text:
    text = text.replace(target_head, new_head_meta, 1)

# 2. Update service worker registration and install prompt handler
old_sw_block = """    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          }, err => {
            console.log('ServiceWorker registration failed: ', err);
          });
        });
      }
    </script>"""

new_sw_block = """    <!-- 🚀 Complete PWA Engine & Install Prompt Handler -->
    <script>
      (function() {
        window.__deferredPwaPrompt = null;
        window.__isPwaInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        window.addEventListener('beforeinstallprompt', function(e) {
          e.preventDefault();
          window.__deferredPwaPrompt = e;
          window.dispatchEvent(new CustomEvent('qap-pwa-installable', { detail: { installable: true } }));
          console.log('⚡ [PWA] App is installable! Omnibox and in-app install triggered.');
        });

        window.addEventListener('appinstalled', function() {
          window.__deferredPwaPrompt = null;
          window.__isPwaInstalled = true;
          window.dispatchEvent(new CustomEvent('qap-pwa-installed', { detail: { installed: true } }));
          console.log('🎉 [PWA] Carrier QAP Calibration Control installed as standalone app.');
        });

        window.__triggerPwaInstall = async function() {
          if (window.__deferredPwaPrompt) {
            window.__deferredPwaPrompt.prompt();
            const choice = await window.__deferredPwaPrompt.userChoice;
            if (choice && choice.outcome === 'accepted') {
              window.__isPwaInstalled = true;
              window.__deferredPwaPrompt = null;
              return { ok: true, installed: true };
            }
            return { ok: false, dismissed: true };
          }
          return { ok: false, noPrompt: true };
        };

        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function() {
            navigator.serviceWorker.register('./sw.js', { scope: './' })
              .then(function(reg) {
                console.log('✅ [PWA] Service Worker active with scope:', reg.scope);
                // Check update
                reg.update().catch(function() {});
              })
              .catch(function(err) {
                console.warn('⚠️ [PWA] Service Worker registration:', err);
              });
          });
        }
      })();
    </script>"""

if old_sw_block in text:
    text = text.replace(old_sw_block, new_sw_block, 1)
else:
    # Try finding and replacing the script containing serviceWorker
    import re
    m = re.search(r'<script>\s*if \(\'serviceWorker\' in navigator\)[\s\S]*?</script>', text)
    if m:
        text = text[:m.start()] + new_sw_block + text[m.end():]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully updated index.html for PWA compliance")
