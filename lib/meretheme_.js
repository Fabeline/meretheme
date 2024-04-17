let selectedPageId = "home";

// The houses listens to size updates from rooms
window.onmessage = (event) => {
    if (event.data.type === "roomSize") {
        document.getElementById(event.data.roomId).height = `${event.data.value}px`;
    }
    else if(event.data.type === "prospectSize"){
        //First find the entrance door
        const entranceDoors = document.querySelectorAll(`[data-mt-type="entrance-door"]`);
        //Then find the prospect;
        entranceDoors.forEach(entranceDoor => {
            if (entranceDoor.getAttribute("data-mt-id") === event.data.houseId) {
                entranceDoor.height = `${event.data.value}px`;
            }
        });
    }
    else if (event.data.type === "registerEntranceDoor") {
        //We are in a house that is just a prospect
        const houseId = event.data.houseId;
        document.body.classList.add('entrance-door');
        //Need to register this prospect in the house
        registerProspect(houseId);
        console.log("Registering prospect")
    }
    else if (event.data.type === "registerHouse") {
        // The room listen to what house it is in
        const menuLinks = document.querySelectorAll('[data-mt-type="menu-link"]');
        const houseId = event.data.houseId;
        menuLinks.forEach(link => {
            if (link.getAttribute('data-mt-id') === houseId) {
                link.classList.add('active');
            }
        });
    }
    else if(event.data.type === "loadProspect"){
        const houseId = event.data.houseId;
        const iframe = document.querySelector(`[data-mt-type="entrance-door"]`);
        iframe.src = `pages/${houseId}.html`;
        iframe.dataset.mtId = houseId;
    }
}

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const getElementHeight = (element) => {
    // Get the computed style of the element
    var style = window.getComputedStyle(element);

    // Add the element's height, vertical padding, vertical borders, and vertical margins
    var totalHeight = element.offsetHeight
        + parseInt(style.marginTop)
        + parseInt(style.marginBottom);

    return totalHeight;
}

// Register a room that will send size updates to the house
const registerRoom = (roomId) => {
    const updateSize = () => {
        window.top.postMessage({
            type: "roomSize",
            roomId,
            value: `${getElementHeight(document.getElementById(roomId)) + 1}`
        }, "*");
    };

    updateSize();
    window.addEventListener("resize", debounce(updateSize, 500));
}

// Register a prospect that will send size updates to the house
const registerProspect = (houseId) => {
    const size = getElementHeight(document.querySelector(`[data-mt-id="${houseId}"]`));

    const updateSize = () => {
        console.log("Updating size")
        window.top.postMessage({
            type: "prospectSize",
            houseId,
            value: size
        }, "*");
    };

    updateSize();
    window.addEventListener("resize", debounce(updateSize, 500));
}

const setActiveLink = () => {
    const house = document.querySelector('[data-mt-type="house"]');
    
    if (house) {
        //Find all doors to rooms in the house
        const doors = document.querySelectorAll('[data-mt-type="door"]');
        
        //Register the house in the doors
        doors.forEach(door => {
            door.contentWindow.postMessage({
                type: "registerHouse",
                houseId: house.getAttribute('data-mt-id')
            }, "*");
        });
    }
};

const registerRooms = () => {
    const room = document.querySelector('[data-mt-type="room"]');
    if (room) {
        registerRoom(room.getAttribute('data-mt-id'));
    }
}

const registerEntranceDoor = () => {
    const entranceDoor = document.querySelector('[data-mt-type="entrance-door"]');
    console.log("e", entranceDoor);
    console.log(document)
    if (entranceDoor) {
        console.log("Registering entrance door")
        entranceDoor.contentWindow.postMessage({
            type: "registerEntranceDoor",
            houseId: entranceDoor.getAttribute('data-mt-id')
        }, "*");
    }
}

const updateLinks = () => {
    const links = document.querySelectorAll('[data-mt-type="menu-link"]');
    links.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const houseId = link.getAttribute('data-mt-id');
            window.top.postMessage({
                type: "loadProspect",
                houseId
            }, "*");
            
        });
        registerEntranceDoor();
    });
}

const isStartPage = () => {
    const mainElement = document.querySelector('[data-mt-main="true"]');
    return mainElement !== null;
};

const loadPage = (pageId) => {
    const iframe = document.querySelector(`[data-mt-type="entrance-door"]`);
    iframe.src = `pages/${pageId}.html`;
}

window.onload = function() {
    setActiveLink();   
    registerRooms();
    registerEntranceDoor();
    updateLinks();
};

