const getPageId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("page") || "home";
}

let debugOn = true;
let selectedHouseId = getPageId();

debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const loadHouse = (houseId) => {
    debug("Loading house:", houseId)
    selectedHouseId = houseId;
    window.history.pushState(null, null, `?page=${selectedHouseId}`);
    const iframe = getEntranceDoor();
    iframe.src = `pages/${selectedHouseId}.html`;
    iframe.dataset.mtId = selectedHouseId;
        
    if(!isTopmostIframe()){
        //Tell parent to update entrance door id
        window.top.postMessage({
            type: "updateEntranceDoor",
            id: selectedHouseId
        }, "*");
    }
}

const getElementHeight = (element) => {
   // Get the computed style of the element
   var style = window.getComputedStyle(element);

   // Add the element's height, vertical padding, vertical borders, and vertical margins
   var totalHeight = element.offsetHeight
       + parseInt(style.marginTop)
       + parseInt(style.marginBottom);

   return totalHeight;
}

const activateLinks = () => {
    const menuLinks = getMenuLinks();
    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            houseId = link.getAttribute('data-mt-link');
            loadHouse(houseId);
            debug("Link clicked:", houseId)
        });
    });
}

const setCurrentLink = () => {  
    const menuLinks = getMenuLinks();
    menuLinks.forEach(link => {
        if (link.getAttribute('data-mt-link') === selectedHouseId) {
            link.classList.add('active');
        }
        else{
            link.classList.remove('active');
        }
    });
}

const isGarden = () => {
    return !!getGarden();
}

const isHouse = () => {
    return !!getHouse();
}

//Can only be one house in the garden
//Register the house in the garden
const registerSizeUpdater = (id) => {
    //Must be called from the house
    const updateSize = () => {
        const element = getByMtId(id).querySelector('[data-mt-type="content"]');
        const size = getElementHeight(element);
        window.top.postMessage({
            type: "resizeElement",
            id,
            value: size
        }, "*");
    };

    updateSize();
    window.addEventListener("resize", debounce(updateSize, 500));
}

const getMenuLinks = () => {
    return document.querySelectorAll('[data-mt-type="menu-link"]');
}

const getEntranceDoor = () => {
    return document.querySelector('[data-mt-type="entrance-door"]');
}

const getGarden = () => {
    return document.querySelector('[data-mt-type="garden"]');
}

const getHouse = () => {
    return document.querySelector('[data-mt-type="house"]');
}

const getByMtId = (id) => {
    return document.querySelector(`[data-mt-id="${id}"]`);
}

const debug = (message) => {
    if(debugOn){
        console.log(message);
    }
}

const redirectHouse = () => {
    //If you are a house and the topmost iframe, go to the garden instead
    if(isTopmostIframe()){
        selectedHouseId = getHouse().getAttribute('data-mt-id');
        const pathPrefix = "../".repeat((selectedHouseId.match(/\//g) || []).length + 1);
        window.location.href = `${pathPrefix}index.html?page=${selectedHouseId}`;
    }
}

// The houses listens to size updates from rooms
window.onmessage = (event) => {
    if (event.data.type === "resizeElement") {
        getEntranceDoor().height = `${event.data.value}px`; 
        //TODO: add support for resizing rooms too
        //getByMtId(event.data.id).height = `${event.data.value}px`;
    }
    else if (event.data.type === "updateEntranceDoor") {
        console.log("y")
        //update the id of the entrance door iframe to the new house
        const iframe = getEntranceDoor;
        iframe.dataset.mtId = event.data.id;
    }
}

window.onload = function() {
    if(isGarden()){
        debug("Garden");
        loadHouse(selectedHouseId);
        setCurrentLink();
        activateLinks();
    }
    else if(isHouse()){
        debug("House")
        redirectHouse();
        registerSizeUpdater(getHouse().getAttribute('data-mt-id'));
    }
};

const isTopmostIframe = () => {
    return window === window.top;
}