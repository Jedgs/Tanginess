// DSA operations written with explicit indexing instead of built-in array methods.
export function appendItem(items, value){
    items[items.length] = value;
}

export function copyItems(items){
    const copy = [];
    for(let i = 0; i < items.length; i++) copy[copy.length] = items[i];
    return copy;
}

export function indexOfValue(items, value){
    for(let i = 0; i < items.length; i++) if(items[i] === value) return i;
    return -1;
}

export function removeItemAt(items, index){
    if(typeof index !== "number" || index % 1 !== 0 || index < 0 || index >= items.length) return false;
    for(let i = index; i < items.length - 1; i++) items[i] = items[i + 1];
    items.length = items.length - 1;
    return true;
}
