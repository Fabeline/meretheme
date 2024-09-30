const bootstrapCDN = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css';
const markedCDN = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
const fontAwesomeCDN = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
const prismStyleCDN = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/themes/prism.min.css';
const prismCodeCDN = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/prism.min.js';

let debugOn = false;
let documentId = ""; // The id for the current document
let darkModeOn = true;
let roomInHouseId = ""; //The id of the house the room is in

const getSelectedHouse = () => {
    getId();
    let houseId = "";
    const queryParams = new URLSearchParams(window.location.search);
    houseId = queryParams.get("page");
    if(!houseId){
        houseId = documentId.replace("-house", "").replace("-garden", "").replace("-room", "");
    }

    return houseId || "home";
};

const getIdFromElement = (element) => {
    let type = "";
    if(element.getAttribute('data-mt-type') === "house"){
        type = "house";
    }
    else if(element.getAttribute('data-mt-type') === "garden"){
        type = "garden";
    }
    else if(element.getAttribute('data-mt-type') === "room"){
        type = "room";
    }
    
    let id = element.getAttribute('src').split("/").pop().split(".")[0];
    id += `-${type}`;
    return id;
}

//Id is based on the path of the page. Everything after "houses" or "rooms" is part of the id        
const getId = () => {
    const paths = location.href.split("/");
    let id = "";
    let activePath = false;
    paths.forEach(path => {
        if(activePath){
            if(id){
                id += "/";
            }
            id += path;
        }
        if(path === "houses" || path === "rooms"){
          activePath = true;  
        };
    });

    id = id.replace(".html", "");
    id += isHouse() ? "-house" : isGarden() ? "-garden" : isRoom() ? "-room" : "";
    documentId = id;
}

const getBaseHouseUrl = () => {
    return window.location.href.split("houses")[0].replace("index.html", "").split("?")[0];
}

const getNewHouseUrl = (houseId, forHistory = false) => {
    const baseHouseUrl = getBaseHouseUrl();
    let housePath = "";
    let queryParams = "";

    // Check if the houseId contains query parameters (e.g., sparetime?highlight=robi)
    if (houseId.includes("?")) {
        const [base, query] = houseId.split("?");
        housePath = `houses/${base}.html`;
        queryParams = `?${query}`;
    } else {
        housePath = `houses/${houseId}.html`;
    }

    let url = "";

    if (window.location.protocol === "file:" && forHistory) {
        url = `?page=${houseId}`;
    } else {
        url = `${baseHouseUrl}${housePath}${queryParams}`;
    }

    return url;
};

// Called by the garden
const loadHouse = (houseId) => {
    debug("Loading house:", houseId);

    window.history.replaceState(null, null, getNewHouseUrl(houseId, true));

    const iframe = getEntranceDoor();
    iframe.src = getNewHouseUrl(houseId);
    iframe.dataset.mtId = houseId;
    
    iframe.onload = () => {
        iframe.contentWindow.postMessage({
            type: "setDarkMode",
            value: darkModeOn
        }, "*");
    }
}

//Called by the house
const loadRooms = () => {
    //Tell the rooms the url to the house they are in
    const rooms = document.querySelectorAll('[data-mt-type="room"]');
    rooms.forEach(room => {
        room.contentWindow.postMessage({
            type: "updateHouseUrl",
            id: getPageUrl()
        }, "*");
    });

}

const registerRoom = () => {
    registerSizeUpdater();
}

const getElementHeight = (element) => {
   const style = window.getComputedStyle(element);
   const totalHeight = element.offsetHeight
       + parseInt(style.marginTop)
       + parseInt(style.marginBottom);

   return totalHeight;
}

// For gardens
const activateLinks = () => {
    const paths = getPaths();
    paths.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            houseId = getIdFromLink(link);
            loadHouse(houseId);
            debug("Link clicked:", houseId)
            setCurrentLink();
            updateShare();
        });
    });
}

// For houses and rooms
const activateInternalLinks = () => {
    const paths = getPaths();
    paths.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const houseId = getIdFromLink(link);
            setCurrentLink();

            window.top.postMessage({
                type: "updateEntranceDoor",
                id: houseId
            }, "*");

            updateShare();
            debug("internal link  clicked:", houseId)
        });
    });
}

const setCurrentLink = () => {  
    const paths = getPaths();
    paths.forEach(link => {
        if (getIdFromLink(link) === getSelectedHouse() || 
            getSelectedHouse().indexOf(`${getIdFromLink(link)}/`) > -1
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
        id = href.replace(".html", "").replace("houses/", "").replaceAll("../", "");
    }
    return id;
}

//Called from the house or room
const updateSize = () => {
    id = documentId;
    const element = document.querySelector('html');
    const size = getElementHeight(element);

    window.parent.postMessage({
        type: "resizeElement",
        componentType: isHouse() ? "house" : "room",
        id,
        value: size
    }, "*");
}

//Register the house in the garden or the room in the house
const registerSizeUpdater = () => {
    debug("Resize updater registered", documentId)
    window.addEventListener("resize", debounce(updateSize, 100));
}

const debug = (...messages) => {
    if(debugOn){
        console.log(...messages);
    }
}

const redirectHouse = () => {
    // If you are a house and the topmost iframe, go to the garden instead with the house included
    if (isTopmostIframe()) {
        const currentParams = window.location.search;  // This includes the query string, e.g., "?highlight=robi"
        const pathPrefix = "../".repeat((documentId.match(/\//g) || []).length + 1).split("?")[0];
        window.location.href = `${pathPrefix}index.html?page=${documentId.replace("-house", "")}${currentParams}`;
    }
}


// The houses listens to size updates from rooms
window.onmessage = (event) => {
    if (event.data.type === "resizeElement") {
        if(event.data.componentType === "house" && isGarden()){
            getEntranceDoor().height = `${event.data.value}px`;
            //Send message "AfterResize" to the houses
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                iframe.contentWindow.postMessage({
                    type: "afterResize",
                    componentType: "house",
                    id: event.data.id
                }, "*");
            });
        }
        else if(event.data.componentType === "room") {
            //Fetch all rooms, and update the right one
            const rooms = document.querySelectorAll(`[data-mt-type="room"]`);
            rooms.forEach(room => {
                if(getIdFromElement(room) === event.data.id){
                    room.height = `${event.data.value}px`;
                }
            });
            //Update the size of the house after resizing the rooms
            updateSize();
        }
    }
    else if (event.data.type === "updateEntranceDoor") {
        //An internal link has been clicked, and we need to update the entrance door src
        const iframe = getEntranceDoor();
        iframe.src = `${getBaseHouseUrl()}/houses/${event.data.id}.html`;

        window.history.replaceState(null, null, getNewHouseUrl(event.data.id, true));

        setCurrentLink();
        updateShare();
    }
    else if (event.data.type === "updateTitle") {
        const titleElement = document.querySelector('title');
        if(titleElement){
            titleElement.textContent = event.data.value;
        }
    }
    else if (event.data.type === "setDarkMode") {
        setDarkMode(event.data.value);
    }
    else if(event.data.type === "updateHouseUrl"){
        roomInHouseId = event.data.id;
    }
}

const updateTitle = () => {
    const titleElement = document.querySelector('title');
    if(titleElement){
        window.top.postMessage({
            type: "updateTitle",
            value: titleElement.textContent
        }, "*");
    }
}

const isTopmostIframe = () => {
    return window === window.top;
}


const hideContent = () => {
    document.body.style.opacity = 0;
}
const showContent = () => {
    document.body.style.opacity = 1;
}

const getPageUrl = () => {
    if(isHouse()){
        return window.location.href;
    }
    else if (isGarden()){
        return getEntranceDoor().src;
    }
    else if(isRoom()){
        //The url of the house the room is in
        return roomInHouseId;
    }
    console.warn("Unknown page type");
    return window.location.href;
}

const updateShare = () => {
    const shareElements = document.querySelectorAll('[data-mt-type="share"]');
    
    shareElements.forEach(shareElement => {
        const serviceTranslations = (shareElement?.dataset?.mtTranslations || "").split(",");
        let translationIndex = 0; //Current translated item
        
        //If not given use all
        const serviceNames = 
            shareElement?.dataset?.mtValue?.replaceAll(", ", ",").split(",") || 
            socialMedia.map(m => m.name)

        //Remove the previous children
        while (shareElement.firstChild) {
            shareElement.removeChild(shareElement.firstChild);
        };
        
        serviceNames.forEach(serviceName => {
            const media = socialMedia.find(m => m.name === serviceName);
            if(!media){
                console.warn("Media not found:", serviceName);
                return;
            }
            
            const name = (serviceTranslations.length > 0 && 
                serviceTranslations[translationIndex]?.trimStart())
                || media.name;

            const a = document.createElement('a');
            a.classList.add('media-share');
            a.href = media.url + getPageUrl();
            a.target = "_blank";
            a.style.backgroundColor = media.color;
            a.style.textDecoration = "none";
            a.innerHTML = `<i aria-label="${name}" style="${media.color}" class="${media.icon}"></i>`;
            shareElement.appendChild(a);
            
            translationIndex++;           
        })    
    });   
}

const houseShouldBeRedirected = () => {
    return isHouse() && isTopmostIframe();
}

const start = () => {
    getId();

    if(isGarden()){
        debug("Found garden");
        loadHouse(getSelectedHouse());
        setCurrentLink();
        activateLinks();
    }
    else if(isHouse()){
        debug("Found house", documentId);
        if(houseShouldBeRedirected()){
            redirectHouse();
        }
        else {
            loadRooms();
            updateTitle();
        }
    }
    else if(isRoom()){
        debug("Found room", documentId);
    }

    if(!houseShouldBeRedirected()){
        //Hide the content until everything is loaded
        hideContent();
        loadExternal();
        insertDarkModeButton();

        if(isHouse() || isRoom()){
            registerSizeUpdater();
            activateInternalLinks();
        }
    }
}

start();