import os
import subprocess
import shutil

os.makedirs('icons', exist_ok=True)
os.makedirs('public/icons', exist_ok=True)

print("1. Creating master 512x512 sharp base icon...")
subprocess.run([
    'convert', 'icons/icon-512x512.png',
    '-resize', '512x512!',
    '-filter', 'Lanczos',
    '-unsharp', '0x0.6+0.8+0.01',
    'icons/icon-512x512.png'
], check=True)

# Define all required sizes for Windows Desktop, Taskbar, PWA, Chrome, Edge, and mobile
sizes = {
    'icon-512x512.png': 512,
    'icon-384x384.png': 384,
    'icon-256x256.png': 256,
    'icon-192x192.png': 192,
    'icon-180x180.png': 180,
    'apple-touch-icon.png': 180,
    'icon-152x152.png': 152,
    'icon-144x144.png': 144,
    'icon-128x128.png': 128,
    'icon-96x96.png': 96,
    'icon-72x72.png': 72,
    'icon-64x64.png': 64,
    'icon-48x48.png': 48,
    'icon-32x32.png': 32,
    'icon-16x16.png': 16,
    'favicon-48x48.png': 48,
    'favicon-32x32.png': 32,
    'favicon-16x16.png': 16
}

print("2. Generating all standard icon sizes with tailored sharpening...")
for filename, s in sizes.items():
    # Tailor sharpening for smaller sizes to avoid fuzziness on Windows desktop
    if s <= 64:
        unsharp_param = '0x0.5+1.2+0.008'
    elif s <= 128:
        unsharp_param = '0x0.5+1.0+0.008'
    else:
        unsharp_param = '0x0.5+0.8+0.005'

    subprocess.run([
        'convert', 'icons/icon-512x512.png',
        '-filter', 'Lanczos',
        '-resize', f'{s}x{s}!',
        '-unsharp', unsharp_param,
        f'icons/{filename}'
    ], check=True)

print("3. Generating maskable icons (for Android adaptive launcher)...")
subprocess.run([
    'convert', '-size', '512x512', 'xc:#0f172a',
    '(', 'icons/icon-512x512.png', '-resize', '410x410', ')',
    '-gravity', 'center', '-composite',
    'icons/icon-maskable-512x512.png'
], check=True)

subprocess.run([
    'convert', '-size', '192x192', 'xc:#0f172a',
    '(', 'icons/icon-192x192.png', '-resize', '154x154', ')',
    '-gravity', 'center', '-composite',
    'icons/icon-maskable-192x192.png'
], check=True)

print("4. Generating multi-resolution favicon.ico...")
ico_frames = [256, 128, 64, 48, 32, 16]
tmp_files = []
for f in ico_frames:
    tmp_path = f'tmp_ico_{f}.png'
    unsharp_param = '0x0.5+1.2+0.008' if f <= 64 else '0x0.5+0.8+0.005'
    subprocess.run([
        'convert', 'icons/icon-512x512.png',
        '-filter', 'Lanczos',
        '-resize', f'{f}x{f}!',
        '-unsharp', unsharp_param,
        tmp_path
    ], check=True)
    tmp_files.append(tmp_path)

subprocess.run(['convert'] + tmp_files + ['icons/favicon.ico'], check=True)
for t in tmp_files:
    if os.path.exists(t):
        os.remove(t)

# Copy favicon.ico to root and public
shutil.copy2('icons/favicon.ico', 'favicon.ico')
shutil.copy2('icons/favicon.ico', 'public/favicon.ico')

print("5. Syncing all icons to public/icons for Vite production build...")
for f in os.listdir('icons'):
    src = os.path.join('icons', f)
    dst = os.path.join('public/icons', f)
    if os.path.isfile(src):
        shutil.copy2(src, dst)

print("6. Verifying dimensions:")
for f in sorted(os.listdir('icons')):
    p = os.path.join('icons', f)
    res = subprocess.run(['identify', p], capture_output=True, text=True)
    print(res.stdout.strip())

print("SUCCESS: All sharp icons generated and verified!")
