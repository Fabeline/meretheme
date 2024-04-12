window.onload = () => {
    window.top.postMessage({
        type: "iframeHeightFooter",
        value: `${document.getElementById("footer").offsetHeight + 1}`
    }, "*");
}