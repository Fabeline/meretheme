window.onmessage = (event) => {
  if (event.data.type === "iframeHeightHeader") {
      document.getElementById("header-iframe").height = `${event.data.value}px`;
  }

  if (event.data.type === "iframeHeightFooter") {
    console.log("aa", document.getElementById("footer-iframe").height)
    document.getElementById("footer-iframe").height = `${event.data.value}px`;
  }
};