window.onload = () => {
    window.top.postMessage({
        type: "iframeHeightHeader",
        value: `${document.getElementById("header").offsetHeight + 1}`
    }, "*");
}