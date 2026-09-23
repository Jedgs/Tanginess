import { customerCartDetails, clearCustomerCart, renderCustomerCart } from "../general/addToCart.js";
import { addOrder, renderOrderStatus } from "./orderStatus.js";
import { getElement, buildOrderSummaryHTML } from "../general/helper.js";
import { generateQRCode } from "../general/qr.js";

let lastCustomerOrderId = 1001;
let lastCustomerQrId = 1;

// Gumagawa ng customer order object mula sa kasalukuyang cart
// Time Complexity: O(n) - kung saan n ay bilang ng items sa cart; nag-iiterate sa buong cart gamit ang single loop para kopyahin ang items at i-accumulate ang totals.
// Space Complexity: O(n) - lumilikha ng bagong orderedItems array na may sukat na n items mula sa cart.
export function buildCustomerOrder(cart){
    let orderTotal = 0;
    let totalCupQuantity = 0;
    const orderId = "ORD-" + lastCustomerOrderId;
    const qrCodeUniqueId = "QR-" + lastCustomerOrderId + "-" + lastCustomerQrId;

    const orderedItems = [];
    for(let i = 0; i < cart.length; i++){
        orderedItems[orderedItems.length] = cart[i];
        orderTotal += cart[i].lineTotal;
        totalCupQuantity += cart[i].quantity;
    }

    return {
        orderId: orderId,
        customerId: "CUS-001",
        orderType: "Online",
        orderStatus: "Pending",
        paymentStatus: "Unpaid",
        paymentMethod: "",
        orderedItems: orderedItems,
        orderTotal: orderTotal,
        totalCupQuantity: totalCupQuantity,
        qrCodeUniqueId: qrCodeUniqueId,
        createdAt: new Date().toLocaleString()
    };
}

// Tinatawag kapag pinindot ng customer ang Checkout button.
// Time Complexity: O(n) - n ay bilang ng cart items; tinatawag ang buildCustomerOrder O(n), addOrder O(1), buildOrderSummaryHTML O(n), at render functions.
// Space Complexity: O(n) - nag-aallocate ng bagong order structure at summary HTML string na may sukat na proporsyonal sa n items.
export function checkoutCustomerCart(){
    if(customerCartDetails.length === 0){
        alert("Cart is empty. Add items before checking out.");
        return;
    }

    const order = buildCustomerOrder(customerCartDetails);

    // I-save ang order sa orderStatus listahan
    addOrder(order);

    // Increment counters para sa susunod na customer order
    lastCustomerOrderId++;
    lastCustomerQrId++;

    // I-clear ang customer cart
    clearCustomerCart();

    // I-render ang checkout summary section at QR Code
    const summarySection = getElement("#checkoutSummarySection");
    const qrContainer = getElement("#qrCodeContainer");
    const qrLabel = getElement("#qrCodeLabel");
    const summaryContainer = getElement("#orderSummaryContainer");

    if(summarySection && qrContainer && qrLabel && summaryContainer){
        summarySection.style.display = "block";
        summaryContainer.innerHTML = buildOrderSummaryHTML(order);
        qrLabel.innerHTML = order.qrCodeUniqueId;
        generateQRCode(qrContainer, order.qrCodeUniqueId);
        summarySection.scrollIntoView({ behavior: "smooth" });
    }

    // I-refresh ang customer cart display
    renderCustomerCart();

    // I-refresh ang order status kung kasalukuyang nakabukas
    const statusSection = getElement("#orderStatusSection");
    if(statusSection && statusSection.style.display !== "none"){
        renderOrderStatus();
    }
}

