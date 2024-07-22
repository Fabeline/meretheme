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