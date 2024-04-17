let debugOn = false;
let selectedHouseId = new URLSearchParams(window.location.search).get("page") || "home";

debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

//Called by the garden
const loadHouse = (houseId) => {
    debug("Loading house:", houseId)
    selectedHouseId = houseId;
    window.history.replaceState(null, null, `?page=${selectedHouseId}`);

    const iframe = getEntranceDoor();
    iframe.src = `pages/${selectedHouseId}.html`;
    iframe.dataset.mtId = selectedHouseId;
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
            houseId = getIdFromLink(link);
            selectedHouseId = houseId;
            
            loadHouse(houseId);
            debug("Link clicked:", houseId)

            setCurrentLink();
        });
    });
}

const activateInternalLinks = () => {
    const menuLinks = getMenuLinks();
    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const houseId = getIdFromLink(link);

            selectedHouseId = houseId;
            setCurrentLink();

            window.top.postMessage({
                type: "updateEntranceDoor",
                id: houseId
            }, "*");

            debug("internal link  clicked:", houseId)
        });
    });
}

const setCurrentLink = () => {  
    const menuLinks = getMenuLinks();
    menuLinks.forEach(link => {
        if (getIdFromLink(link) === selectedHouseId || 
        selectedHouseId.indexOf(`${getIdFromLink(link)}/`) > -1
        ) {
            link.classList.add('active');
        }
        else{
            link.classList.remove('active');
        }
    });
}

const getIdFromLink = (link) => {
    const href = link.getAttribute('href');
    let id = "home";

    if(href !== "index.html"){
        id = href.replace(".html", "").replace("pages/", "").replaceAll("../", "");
    }
    return id;
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
        //An internal link has been clicked, and we need to update the entrance door src
        selectedHouseId = event.data.id;
        const iframe = getEntranceDoor();
        iframe.dataset.mtId = event.data.id;
        iframe.src = `pages/${event.data.id}.html`;
        window.history.replaceState(null, null, `?page=${selectedHouseId}`);
        setCurrentLink();
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
        activateInternalLinks();
        registerSizeUpdater(getHouse().getAttribute('data-mt-id'));
    }
};

const isTopmostIframe = () => {
    return window === window.top;
}