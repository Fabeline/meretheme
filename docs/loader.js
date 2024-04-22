const merethemeStyleCDN = "https://cdn.jsdelivr.net/gh/fabeline/meretheme@latest/lib/meretheme.css"; // "file:///C:/progging/meretheme/lib/meretheme.css";
const merethemeCodeCDN =  "https://cdn.jsdelivr.net/gh/fabeline/meretheme@latest/lib/meretheme.js"; //"file:///C:/progging/meretheme/lib/meretheme.js";

window.addEventListener('load', function() {
    document.body.style.opacity = 0;
    var script = document.createElement('script');
    script.src = merethemeCodeCDN;
    document.head.appendChild(script);

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = merethemeStyleCDN;
    document.head.appendChild(link);
});
