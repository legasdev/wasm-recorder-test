function domSearchElement(selector, all = false) {
    return all
        ? document.querySelectorAll(selector)
        : document.querySelector(selector);
}

export {
    domSearchElement,
};