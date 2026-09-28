// Shared in-memory arrays for the current page session.

export const orderDetails = [];
export const orderQueueDetails = [];
export const orderLogsDetails = [];
let activeCashierBranch = "Malolos";

export const branches = ["Malolos", "Pulilan"];

export function isValidBranch(branch){
    for(let i = 0; i < branches.length; i++) if(branches[i] === branch) return true;
    return false;
}

export function setActiveCashierBranch(branch){
    if(!isValidBranch(branch)) return false;
    activeCashierBranch = branch;
    return true;
}

export function getActiveCashierBranch(){
    return activeCashierBranch;
}

export function getOrderBranch(order){
    return isValidBranch(order.branch) ? order.branch : "Malolos";
}

export function getOrderType(order){
    if(order.orderType === "Takeout" || order.orderType === "Dine In") return order.orderType;
    return order.fulfillment || "Takeout";
}

export function createOrderId(){
    if(globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"){
        const uuid = globalThis.crypto.randomUUID();
        let shortId = "";
        for(let i = 0; i < 8; i++) shortId += uuid[i];
        return "ORD-" + shortId.toUpperCase();
    }
    const randomText = Math.random().toString(36);
    let suffix = "";
    for(let i = 2; i < 8 && i < randomText.length; i++) suffix += randomText[i];
    return "ORD-" + Date.now().toString(36).toUpperCase() + suffix.toUpperCase();
}
