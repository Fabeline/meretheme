const merethemeStyleCDN = /*"https://www.fabeline.com/meretheme/lib/meretheme.css"*/ "https://cdn.jsdelivr.net/gh/fabeline/meretheme@latest/lib/meretheme.css"; // "file:///C:/progging/meretheme/lib/meretheme.css";*/
const merethemeCodeCDN =  /*"https://www.fabeline.com/meretheme/lib/meretheme.min.js"*/ "https://cdn.jsdelivr.net/gh/fabeline/meretheme@latest/lib/meretheme.min.js"; // "file:///C:/progging/meretheme/lib/meretheme.js";*/

window.addEventListener('load', function() {
    var script = document.createElement('script');
    script.src = merethemeCodeCDN;
    document.head.appendChild(script);

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = merethemeStyleCDN;
    document.head.appendChild(link);
});
