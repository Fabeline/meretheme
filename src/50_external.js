//This file handles external libraries

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

const loadExternal = () => {
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
}