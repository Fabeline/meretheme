const bootstrapCDN = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css';
const markedCDN = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
const fontAwesomeCDN = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
const prismStyleCDN = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/themes/prism.min.css';
const prismCodeCDN = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/prism.min.js';

let debugOn = false;
let documentId = ""; // The id for the current document
let darkModeOn = true;

const getSelectedHouse = ()  => {
    return new URLSearchParams(window.location.search).get("page") || "home";
}

const getPaths = () => {
    return document.querySelectorAll('[data-mt-type="path"]');
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

const getRoom = () => {
    return document.querySelector('[data-mt-type="room"]');
}

const isGarden = () => {
    return !!getGarden();
}

const isHouse = () => {
    return !!getHouse();
}

const isRoom = () => {
    return !!getRoom();
}

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

const getId = () => {
    let id = location.href.split("/").pop().split(".")[0];
    id += isHouse() ? "-house" : isGarden() ? "-garden" : isRoom() ? "-room" : "";
    documentId = id;
}

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
    window.history.replaceState(null, null, `?page=${houseId}`);

    const iframe = getEntranceDoor();
    iframe.src = `houses/${houseId}.html`;
    iframe.dataset.mtId = houseId;

    iframe.onload = () => {
        iframe.contentWindow.postMessage({
            type: "setDarkMode",
            value: darkModeOn
        }, "*");
    }
}

const registerRoom = (id) => {
    registerSizeUpdater();
}

const getElementHeight = (element) => {
   const style = window.getComputedStyle(element);
   // Add the element's height, vertical padding, vertical borders, and vertical margins
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

//Can only be one house in the garden
//Register the house in the garden
const registerSizeUpdater = () => {
    debug("Resize updater registered", documentId)
    //updateSize();
    setTimeout(updateSize, 100);
    window.addEventListener("resize", debounce(updateSize, 100));
}

const debug = (...messages) => {
    if(debugOn){
        console.log(...messages);
    }
}

const redirectHouse = () => {
    //If you are a house and the topmost iframe, go to the garden instead with the house included
    if(isTopmostIframe()){
        const pathPrefix = "../".repeat((documentId.match(/\//g) || []).length + 1);
        window.location.href = `${pathPrefix}index.html?page=${documentId.replace("-house", "")}`;
    }
}

// The houses listens to size updates from rooms
window.onmessage = (event) => {
    if (event.data.type === "resizeElement") {
        if(event.data.componentType === "house"){
            getEntranceDoor().height = `${event.data.value}px`;
        }
        else if(event.data.componentType === "room") {
            //Fetch all rooms, and uptdate the right one
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
        //iframe.dataset.mtId = event.data.id;
        iframe.src = `houses/${event.data.id}.html`;
        window.history.replaceState(null, null, `?page=${event.data.id}`);
        setCurrentLink();
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

window.onload = function() {
    getId();

    //First set all iframes to 100vh height
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.height = "100vh";
    }
    );


    if(isGarden()){
        debug("Found garden");
        loadHouse(getSelectedHouse());
        setCurrentLink();
        activateLinks();
    }
    else if(isHouse()){
        debug("Found house", documentId);
        redirectHouse();
        document.querySelector('html').classList.add('mt-house');
        activateInternalLinks();
        updateTitle();
    }
    else if(isRoom()){
        debug("Found room", documentId);
        registerSizeUpdater();
        activateInternalLinks();
    }

    includeFontAwesome();
    convertMarkdownToHTML();
    includeBootstrap();
    loadPrismAndHighlightCode();
    insertDarkModeButton();

    if(isHouse()){
        registerSizeUpdater();
    }
};

const isTopmostIframe = () => {
    return window === window.top;
}

function ensureMarkedIsLoaded(callback) {
    if (typeof window.marked !== 'function') {
        // The marked library is not loaded, load it dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = () => {
            callback();
        };
        script.onerror = () => {
            console.error('Failed to load the marked library from CDN');
        };
        document.head.appendChild(script);
    } else {
        // The marked library is already loaded, call the callback immediately
        callback();
    }
}

function convertMarkdownToHTML() {
    const markdownElements = document.querySelectorAll('[data-mt-markdown="true"]');
    if (markdownElements.length > 0) {
        ensureMarkedIsLoaded(() => {
            marked.setOptions({
                sanitize: false
            });
            markdownElements.forEach(element => {
                let markdownContent = element.textContent;
                // Normalize line endings to Unix style
                markdownContent = markdownContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
                // Remove leading whitespace from each line
                markdownContent = markdownContent.split('\n').map(line => line.trimStart()).join('\n');
                const htmlContent = marked.parse(markdownContent);
                element.innerHTML = htmlContent;
            });
            updateSize();
        });
    }
}

const includeFontAwesome = () => {
    const elements = document.querySelectorAll('[data-mt-include="font-awesome"]');
    if (elements.length > 0 && !document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontAwesomeCDN;
        document.head.appendChild(link);
    }
};

const includeBootstrap = () => {
    const elements = document.querySelectorAll('[data-mt-include="bootstrap"]');
    if (elements.length > 0 && !document.querySelector('link[href*="bootstrap"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = bootstrapCDN;
        document.head.appendChild(link);
    }
};

const highlightCode = () => {
    const codeElements = document.querySelectorAll('[data-mt-code="true"]');
    codeElements.forEach(codeElement => {
        // Wrap the code in <pre> and <code> tags
        const pre = document.createElement('pre');
        //add css class to pre element
        const lang = codeElement.getAttribute("data-mt-code-lang");
        pre.classList.add(`language-${lang}`);        
        const code = document.createElement('code');
        code.textContent = codeElement.textContent;
        pre.appendChild(code);

        // Replace the original element with the new one
        codeElement.parentNode.replaceChild(pre, codeElement);

        // Highlight the code
        Prism.highlightElement(code);
    });
};

const loadPrismAndHighlightCode = () => {
   const elements = document.querySelectorAll('[data-mt-code="true"]');
    
    if (elements.length > 0 && !document.querySelector('link[href*="prism"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = prismStyleCDN;
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = prismCodeCDN;
        script.onload = () => {
            window.Prism = window.Prism || {};
            window.Prism.manual = true;
            highlightCode();
        };
        document.head.appendChild(script);
    } else {
        highlightCode();
    }
};

const setDarkMode = (newValue) => {
    darkModeOn = newValue;
    const html = document.querySelector('html');

    if(!darkModeOn){
        html.classList.add('light-mode');
    }
    else{
        html.classList.remove('light-mode');
    }

    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach(iframe => {
        iframe.contentWindow.postMessage({ 
            type: "setDarkMode",
            value: darkModeOn
        }, "*");
    });
}

const insertDarkModeButton = () => {
    const elements = document.querySelectorAll('[data-mt-button="dark-mode"]');
    if (elements.length > 0) {
        const button = document.createElement('button');
        button.textContent = 'Toggle Dark Mode';
        button.onclick = () => setDarkMode(!darkModeOn);
        elements.forEach(element => element.appendChild(button));

    }
};