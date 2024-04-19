let debugOn = false;
let selectedHouseId = new URLSearchParams(window.location.search).get("page") || "home";
let darkModeOn = true;

const bootstrapCDN = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
const markedCDN = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
const tailwindCDN = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
const fontAwesomeCDN = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';

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

    iframe.onload = () => {
        iframe.contentWindow.postMessage({
            type: "setDarkMode",
            value: darkModeOn
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

const updateSize = () => {
    id = selectedHouseId;
    //Must be called from the house
    const element = document.querySelector('html');
    const size = getElementHeight(element);
    window.top.postMessage({
        type: "resizeElement",
        id,
        value: size
    }, "*");
}

//Can only be one house in the garden
//Register the house in the garden
const registerSizeUpdater = () => {
    updateSize();
    window.addEventListener("resize", debounce(updateSize), 100);
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
    if(isGarden()){
        debug("Loading garden");
        loadHouse(selectedHouseId);
        setCurrentLink();
        activateLinks();
    }
    else if(isHouse()){
        debug("Loading house")
        redirectHouse();
        document.querySelector('html').classList.add('mt-house');
        selectedHouseId = getHouse().getAttribute('data-mt-id');
        activateInternalLinks();
        updateTitle();
    }
    includeFontAwesome();
    includeTailwind();
    convertMarkdownToHTML();
    includeBootstrap();
    //includeBulma();
    //includeW3CSS();
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
            markdownElements.forEach(element => {
                let markdownContent = element.textContent;
                // Normalize line endings to Unix style
                markdownContent = markdownContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
                // Remove leading whitespace from each line
                markdownContent = markdownContent.split('\n').map(line => line.trimStart()).join('\n');
                const htmlContent = window.marked.parse(markdownContent);
                element.innerHTML = htmlContent;
            });
            updateSize();
        });
    }
}

const includeFontAwesome = () => {
    const elements = document.querySelectorAll('[class*="fa-"]');
    if (elements.length > 0 && !document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(link);
    }
};

//a function that includes tailwind css only once if data-mt-include="tailwind" is present
const includeTailwind = () => {
    const elements = document.querySelectorAll('[data-mt-include="tailwind"]');
    if (elements.length > 0 && !document.querySelector('link[href*="tailwind"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
        document.head.appendChild(link);
    }
};

//a function that includes bootstrap css only once if data-mt-include="bootstrap" is present
const includeBootstrap = () => {
    const elements = document.querySelectorAll('[data-mt-include="bootstrap"]');
    if (elements.length > 0 && !document.querySelector('link[href*="bootstrap"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
        document.head.appendChild(link);
    }
};

/*
//a function that includes bulma css only once if data-mt-include="bulma" is present
const includeBulma = () => {
    const elements = document.querySelectorAll('[data-mt-include="bulma"]');
    if (elements.length > 0 && !document.querySelector('link[href*="bulma"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css';
        document.head.appendChild(link);
    }
};

//a function that includes w3.css only once if data-mt-include="w3.css" is present
const includeW3CSS = () => {
    const elements = document.querySelectorAll('[data-mt-include="w3.css"]');
    if (elements.length > 0 && !document.querySelector('link[href*="w3.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://www.w3schools.com/w3css/4/w3.css';
        document.head.appendChild(link);
    }
}*/


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

//a function that inserts a button to change between light mode and dark mode on the html page and it iframe children if data-mt-button="dark-mode" is present
const insertDarkModeButton = () => {
    const elements = document.querySelectorAll('[data-mt-button="dark-mode"]');
    if (elements.length > 0) {
        const button = document.createElement('button');
        button.textContent = 'Toggle Dark Mode';
        button.onclick = () => setDarkMode(!darkModeOn);
        elements.forEach(element => element.appendChild(button));

    }
};