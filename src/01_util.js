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

debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};