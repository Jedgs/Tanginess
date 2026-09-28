import { getElement } from "./helper.js";

// These zero-only numbers are display fixtures, never payment destinations.
const SAMPLE_NUMBERS = {
    GCash: "0000 000 0000",
    Maya: "0000 000 0000",
    BPI: "0000 0000 0000",
    BDO: "0000 0000 0000"
};

export function isCashlessPaymentMethod(method){
    return method === "GCash" || method === "Maya" || method === "BPI" || method === "BDO";
}

export function renderDemoPayment(prefix, method, cart){
    const panel = getElement(`#${prefix}DemoPayment`);
    if(!panel) return;
    const action = getElement(prefix === "customer" ? "#btnCheckout" : "#adminConfirmWalkInOrderButton");
    if(action) action.disabled = cart.length === 0;
    panel.hidden = !isCashlessPaymentMethod(method);
    if(panel.hidden) return;

    let amount = 0;
    for(let i = 0; i < cart.length; i++) amount += Number(cart[i].lineTotal);
    getElement(`#${prefix}DemoMethod`).textContent = method;
    getElement(`#${prefix}DemoNumber`).textContent = SAMPLE_NUMBERS[method];
    getElement(`#${prefix}DemoAmount`).textContent = amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
