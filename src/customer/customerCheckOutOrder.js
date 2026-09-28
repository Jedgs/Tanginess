import { customerCartDetails, clearCustomerCart, renderCustomerCart } from "../general/addToCart.js";
import { orderDetails, orderQueueDetails, createOrderId, isValidBranch } from "../general/orderStore.js";
import { renderOrderStatus } from "./orderStatus.js";
import { renderOrderQueue } from "../cashier/orderQueue.js";
import { getElement, buildOrderSummaryHTML } from "../general/helper.js";
import { isCashlessPaymentMethod } from "../general/demoPayment.js";
import { isCartItemAvailable } from "../general/menu.js";

export function buildCustomerOrder(cart, paymentMethod, orderType, branch){
    let orderTotal = 0;
    let totalCupQuantity = 0;
    const orderedItems = [];
    for(const item of cart){
        orderedItems[orderedItems.length] = item;
        orderTotal += item.lineTotal;
        totalCupQuantity += item.quantity;
    }

    return {
        orderId: createOrderId(),
        customerId: "CUS-001",
        orderType,
        orderSource: "Online",
        branch,
        orderStatus: "Pending Confirmation",
        paymentStatus: "Paid (Demo)",
        paymentConfirmedAt: new Date().toISOString(),
        paymentVerification: "demo-confirmation",
        paymentMethod,
        orderedItems,
        orderTotal,
        totalCupQuantity,
        createdAt: new Date().toLocaleString()
    };
}

export function checkoutCustomerCart(){
    const paymentSelect = getElement("#customerPaymentMethod");
    const orderTypeSelect = getElement("#customerOrderType");
    const branchSelect = getElement("#customerBranch");
    const message = getElement("#customerCheckoutMessage");
    const paymentMethod = paymentSelect?.value || "";
    const orderType = orderTypeSelect?.value || "";
    const branch = branchSelect?.value || "";

    if(customerCartDetails.length === 0 || !isCashlessPaymentMethod(paymentMethod) ||
        (orderType !== "Takeout" && orderType !== "Dine In") || !isValidBranch(branch)){
        if(message) message.textContent = "Select a branch, add an item, then choose a cashless payment method and Takeout or Dine In.";
        return;
    }

    for(let i = 0; i < customerCartDetails.length; i++){
        if(!isCartItemAvailable(branch, customerCartDetails[i])){
            if(message) message.textContent = "An item in your cart is no longer available at this branch. Remove it before checkout.";
            return;
        }
    }

    const order = buildCustomerOrder(customerCartDetails, paymentMethod, orderType, branch);
    orderDetails[orderDetails.length] = order;
    orderQueueDetails[orderQueueDetails.length] = order;
    clearCustomerCart();
    renderCustomerCart();
    renderOrderQueue();
    renderOrderStatus();
    paymentSelect.value = "";
    orderTypeSelect.value = "";
    if(message) message.textContent = "";

    const summarySection = getElement("#checkoutSummarySection");
    const summaryContainer = getElement("#orderSummaryContainer");
    const confirmation = getElement("#checkoutConfirmation");
    if(summarySection && summaryContainer && confirmation){
        summarySection.style.display = "block";
        confirmation.textContent = `Demo payment confirmed. ${order.orderId} is in the ${branch} cashier queue. Check Order Status for preparation updates. ${orderType} · ${paymentMethod}.`;
        summaryContainer.innerHTML = buildOrderSummaryHTML(order);
        summarySection.scrollIntoView({ behavior: "smooth" });
    }
}
