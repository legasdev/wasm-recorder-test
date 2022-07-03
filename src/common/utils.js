function domSearchElement(selector, all = false) {
    return all
        ? document.querySelectorAll(selector)
        : document.querySelector(selector);
}

function domCreateElement(tagName, options) {
    const element = document.createElement(tagName);

    for (const option of Object.keys(options)) {
        element[option] = options[option];
    }

    return element;
}

export {
    domSearchElement,
    domCreateElement,
};