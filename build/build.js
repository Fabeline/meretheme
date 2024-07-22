document.getElementById('fileInput').addEventListener('change', function(event) {
    const files = event.target.files;
    const fileContentsContainer = document.getElementById('fileContents');
    fileContentsContainer.innerHTML = ''; // Clear previous contents
  
    let combinedContent = '';
    let filesProcessed = 0;
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
  
      reader.onload = function(e) {
        const content = e.target.result;
        combinedContent += content + '\n'; // Concatenate file contents with a newline
        filesProcessed++;
  
        const fileContentDiv = document.createElement('div');
        fileContentDiv.innerHTML = `<h3>${file.name}</h3>`;
        fileContentsContainer.appendChild(fileContentDiv);
  
        // If all files have been processed, trigger the download
        if (filesProcessed === files.length) {
          minifyAndDownload(combinedContent);
        }
      };
  
      reader.onerror = function(e) {
        console.error(`Error reading file ${file.name}:`, e);
      };
  
      reader.readAsText(file);
    }
  });
  
  async function minifyAndDownload(content) {
    // Minify the combined content using Terser
    try {
      const minifiedResult = await Terser.minify(content);
      if (minifiedResult.error) {
        throw minifiedResult.error;
      }
  
      const minifiedContent = minifiedResult.code;
      triggerDownload(minifiedContent, "meretheme.min.js");
      triggerDownload(content, "meretheme.js");
    } catch (error) {
      console.error('Error during minification:', error);
    }
  }
  
  function triggerDownload(content, fileName) {
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
  
    // Programmatically click the download link to trigger the download
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  
    // Release the object URL
    URL.revokeObjectURL(url);
  }
  