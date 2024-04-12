window.onmessage = (event) => {
  if (event.data.type === "roomSize") {
      document.getElementById(event.data.roomId).height = `${event.data.value}px`;
  }
};

const registerRoom = (roomId) => {
    window.top.postMessage({
        type: "roomSize",
        roomId,
        value: `${document.getElementById(roomId).offsetHeight + 1}`
    }, "*");
  
}