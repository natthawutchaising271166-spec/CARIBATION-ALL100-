import re
with open("pdf_compressor.js", "r") as f:
    text = f.read()

new_optimize = """async function optimizeDocumentCanvas(ctx, width, height) {
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const len = data.length;
      
      const chunkSize = width * 4 * 30; // 30 rows at a time
      
      for (let i = 0; i < len; i += chunkSize) {
        const end = Math.min(i + chunkSize, len);
        for (let j = i; j < end; j += 4) {
          const r = data[j];
          const g = data[j + 1];
          const b = data[j + 2];
          
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const chroma = maxC - minC;
          
          if (chroma > 25) {
            data[j] = Math.min(255, Math.round(r * 1.05));
            data[j + 1] = Math.min(255, Math.round(g * 1.05));
            data[j + 2] = Math.min(255, Math.round(b * 1.05));
            continue;
          }
          
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum >= 205) {
            data[j] = 255; data[j + 1] = 255; data[j + 2] = 255;
          } else if (lum <= 125) {
            const darkFactor = 0.82;
            data[j] = Math.round(r * darkFactor);
            data[j + 1] = Math.round(g * darkFactor);
            data[j + 2] = Math.round(b * darkFactor);
          } else {
            const t = (lum - 125) / (205 - 125);
            const val = Math.min(255, Math.round(lum + t * (255 - lum)));
            data[j] = val; data[j + 1] = val; data[j + 2] = val;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('[DocOptimizer] Canvas filter fallback:', e);
    }
  }"""

pattern = r"function optimizeDocumentCanvas.*?fallback:\x27, e\);\n    }\n  }"
text = re.sub(pattern, new_optimize, text, flags=re.DOTALL)

# Adjust compressImageToJpeg
text = text.replace("img.onload = () => {", "img.onload = async () => {")
text = text.replace("optimizeDocumentCanvas(ctx, width, height);", "await optimizeDocumentCanvas(ctx, width, height);")

# Adjust compressPdfFile
text = text.replace("optimizeDocumentCanvas(ctx, canvas.width, canvas.height);", "await optimizeDocumentCanvas(ctx, canvas.width, canvas.height);")

# Also change max dimension to 1000 and quality to 0.65 for smaller size
text = text.replace("const maxDimension = options.maxDimension || 1300;", "const maxDimension = options.maxDimension || 1000;")
text = text.replace("const quality = options.quality || 0.70;", "const quality = options.quality || 0.60;")
text = text.replace("maxWidth = 1300, quality = 0.70", "maxWidth = 1000, quality = 0.60")

with open("pdf_compressor.js", "w") as f:
    f.write(text)

