export async function shareDNA(insights) {
  // If insights aren't passed directly, try to compute them or pull from somewhere
  // For the prototype, we expect an array of string descriptions or labels

  // 1. Create the DOM element
  const container = document.createElement('div');
  container.id = 'dna-card-container';

  // Extract just the bolded titles from the insights array (e.g. "Structured Maker")
  const shortTraits = insights.map(text => {
    const match = text.match(/<strong>(.*?)<\/strong>/);
    return match ? match[1] : text.split(' ')[0];
  }).filter(t => t);

  const traitHtml = shortTraits.map(t => `<div class="trait-badge">${t}</div>`).join('');

  container.innerHTML = `
    <div class="dna-card-inner">
      <div class="dna-card-header">
        <h1>My Activity DNA</h1>
        <p>I stopped scrolling and found my hobbies.</p>
      </div>
      <div class="dna-card-traits">
        ${traitHtml}
      </div>
      <div class="dna-card-footer">
        <div class="brand">FALLOW</div>
        <div class="url">Discover yours at fallow.fi99.ca</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // 2. Render to Canvas
    // Ensure html2canvas is loaded globally
    if (typeof html2canvas === 'undefined') {
      console.error("html2canvas not loaded");
      document.body.removeChild(container);
      return;
    }

    // Slight delay to ensure fonts/CSS are applied
    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(container, {
      scale: 2, // High res for sharing
      backgroundColor: null
    });

    // 3. Convert to Blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error("Canvas to Blob failed");
        document.body.removeChild(container);
        return;
      }

      const file = new File([blob], 'my_fallow_dna.png', { type: 'image/png' });

      // 4. Try native Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'My Fallow DNA',
            text: 'Discover your hidden hobbies based on your psychological DNA.',
            files: [file]
          });
        } catch (err) {
          console.log("Share cancelled or failed:", err);
          // Fallback to download if share failed (but not if user just cancelled)
          if (err.name !== 'AbortError') {
            triggerDownload(blob);
          }
        }
      } else {
        // Fallback for desktop / browsers without file share support
        triggerDownload(blob);
      }

      // Cleanup
      document.body.removeChild(container);
    }, 'image/png');

  } catch (err) {
    console.error("Error generating share image:", err);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

function triggerDownload(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fallow_dna.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
