const bootstrapCDN = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css';
const markedCDN = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
const fontAwesomeCDN = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
const prismStyleCDN = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/themes/prism.min.css';
const prismCodeCDN = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/prism.min.js';

let debugOn = false;
let documentId = ""; // The id for the current document
let darkModeOn = true;
let roomInHouseId = ""; //The id of the house the room is in

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

//Id is based on the path of the page. Everything after "houses" is part of the id        
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
        iframe.src = `houses/${event.data.id}.html`;
        window.history.replaceState(null, null, `?page=${event.data.id}`);
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

const shouldLoadMarkdown = () => {
    return document.querySelectorAll('[data-mt-markdown="true"]').length > 0;
}
const shouldLoadPrism = () => {
    return document.querySelectorAll('[data-mt-code="true"]').length > 0;
}
const shouldLoadBootstrap = () => {
    return document.querySelectorAll('[data-mt-include="bootstrap"]').length > 0;
}
const shouldAddShare = () => {
    return document.querySelectorAll('[data-mt-type="share"]').length > 0;
}
const shouldLoadFontAwesome = () => {
    return shouldAddShare() || 
        document.querySelectorAll('[data-mt-include="font-awesome"]').length > 0;
}

const includeStyle = (packageName, cdn) => {
    return new Promise((resolve, reject) => {
       if (!document.querySelector(`link[href*="${packageName}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cdn;
            document.head.appendChild(link);
            link.onload = () => {
                resolve();
            };
            link.onerror = () => {
                reject(new Error(`Failed to load ${packageName}` ));
            };
        } else {
            resolve();
        }
    });
};

const includeScript = (packageName, loadCondition, cdn) => {
    return new Promise((resolve, reject) => {
        if (loadCondition && !document.querySelector(`script[src*="${packageName}"]`)) {
            const script = document.createElement('script');
            script.src = cdn;
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load ${packageName}`));
            };
            document.head.appendChild(script);            
        } else {
            resolve();
        }
    });
}

const highlightCode = () => {
    window.Prism = window.Prism || {};
    window.Prism.manual = true;
    
    const codeElements = document.querySelectorAll('[data-mt-code="true"]');
    codeElements.forEach(codeElement => {
        // Wrap the code in <pre> and <code> tags
        const pre = document.createElement('pre');
        const lang = codeElement.getAttribute("data-mt-code-lang");
        pre.classList.add(`language-${lang}`);        
        const code = document.createElement('code');
        code.textContent = codeElement.textContent;
        pre.appendChild(code);
        codeElement.parentNode.replaceChild(pre, codeElement);    
        Prism.highlightElement(code);
    });
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

const convertMarkdownToHTML = () => {
    const markdownElements = document.querySelectorAll('[data-mt-markdown="true"]');
    if(!markdownElements){
        return;
    }

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
    return window.location.href;
}

const socialMedia = [
    { name: 'facebook', url: 'https://www.facebook.com/sharer/sharer.php?u=' , icon: 'fab fa-facebook', color: '#3b5998' },
    { name: 'twitter', url: 'https://twitter.com/intent/tweet?url=', icon: 'fab fa-twitter', color: '#00acee' },
    { name: 'linkedin', url: 'https://www.linkedin.com/shareArticle?url=', icon: 'fab fa-linkedin', color: '#0e76a8' },
    { name: 'whatsapp', url: 'https://api.whatsapp.com/send?text=', icon: 'fab fa-whatsapp', color: '#25d366' },
    { name: 'email', url: 'mailto:?body=', icon: 'fas fa-envelope', color: '#46555c'},
    { name: 'pinterest', url: 'https://pinterest.com/pin/create/button/?url=', icon: 'fab fa-pinterest', color: '#bd081c'},
    { name: 'reddit', url: 'https://www.reddit.com/submit?url=', icon: 'fab fa-reddit', color: '#ff4500'},
    { name: 'telegram', url: 'https://t.me/share/url?url=', icon: 'fab fa-telegram', color: '#0088cc'},
    { name: 'tumblr', url: 'https://www.tumblr.com/widgets/share/tool/preview?canonicalUrl=', icon: 'fab fa-tumblr', color: '#35465d'},
    { name: 'discord', url: 'https://discord.com/channels/@me', icon: 'fab fa-discord', color: '#5865f2'},
    { name: 'mastodon', url: 'https://share.nuclino.com/', icon: 'fab fa-mastodon', color: '#3088d4'},
    { name: 'copy', url: '', icon: 'fas fa-copy', color: '#46555c'},
    
]

//TODO: Support translations in different order
const updateShare = () => {
    const shareElements = document.querySelectorAll('[data-mt-type="share"]');
    
    shareElements.forEach(shareElement => {
        const serviceTranslations = (shareElement?.dataset?.mtTranslations || "").split(",");
        const copyConfirmTranslation = shareElement?.dataset?.mtCopyConfirmTranslation || "Link copied to clipboard!";
        let translationIndex = 0; //Current translated item
        const shareService = shareElement?.dataset?.mtValue || "all";

        while (shareElement.firstChild) {
            shareElement.removeChild(shareElement.firstChild);
        };

        socialMedia.forEach(media => {
            if(shareService === "all" || shareService.indexOf(media.name) > -1){
                const name = serviceTranslations.length > 0? 
                    serviceTranslations[translationIndex]?.trimStart() : media.name;

                if(media.name === "copy"){                  
                    const button = document.createElement('button');
                    button.classList.add('media-share');                    
                    button.style.backgroundColor = media.color;
                    button.style.textDecoration = "none";
                    button.innerHTML = `
                        <i aria-label="${name}" style="${media.color}" class="${media.icon}"></i>
                        <div style="display: none;" class="copy-confirmation"></div>
                        `;
                    button.onclick = (e) => {
                        navigator.clipboard.writeText(getPageUrl());
                        const confirmation = e.currentTarget?.querySelector('.copy-confirmation');
                        confirmation.style="display: block;";
                        confirmation.textContent = copyConfirmTranslation;
                        setTimeout(() => {
                            confirmation.style="display: none;";
                            confirmation.textContent = "";
                        }, 2000);
                    }
                    shareElement.appendChild(button);                
                }
                else {
                    const a = document.createElement('a');
                    a.classList.add('media-share');
                    a.href = media.url + getPageUrl();
                    a.target = "_blank";
                    a.style.backgroundColor = media.color;
                    a.style.textDecoration = "none";
                    a.innerHTML = `<i aria-label="${name}" style="${media.color}" class="${media.icon}"></i>`;
                    shareElement.appendChild(a);
                }
                translationIndex++;
            }
        });
    })       
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
        redirectHouse();
        loadRooms();
        updateTitle();
    }
    else if(isRoom()){
        debug("Found room", documentId);
    }

    //Hide the content until everything is loaded
    hideContent();

    Promise.all([
        shouldLoadFontAwesome() && includeStyle('font-awesome', fontAwesomeCDN),
        shouldLoadBootstrap() && includeStyle('bootstrap', bootstrapCDN),
        shouldLoadMarkdown() && includeScript('marked', () => typeof window.marked !== 'function', markedCDN),
        shouldLoadPrism() && includeStyle('prism', prismStyleCDN),
        shouldLoadPrism() && includeScript('prism', () => typeof window.Prism === 'undefined', prismCodeCDN),        
    ]).then(() => {
        shouldLoadMarkdown() && convertMarkdownToHTML();
        shouldLoadPrism() && highlightCode();
        shouldAddShare() && updateShare();

        showContent();

        if(isHouse() || isRoom()){
            updateSize();
        }
    }).catch(error => {
        console.error('Error loading scripts:', error);
    });

    insertDarkModeButton();

    if(isHouse() || isRoom()){
        registerSizeUpdater();
        activateInternalLinks();
    }
}

start();