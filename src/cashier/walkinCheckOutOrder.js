import { walkinCartDetails, clearWalkinCart, renderWalkinCart } from "../general/addToCart.js";
import { orderQueueDetails, createOrderId, getActiveCashierBranch } from "../general/orderStore.js";
import { renderOrderQueue } from "./orderQueue.js";
import { getElement } from "../general/helper.js";
import { isCashlessPaymentMethod } from "../general/demoPayment.js";
import { isCartItemAvailable } from "../general/menu.js";

// Gumagawa ng walk-in order object mula sa laman ng walk-in cart (DSA accumulation).
// Time Complexity: O(n) - kung saan n ay bilang ng cart items; ini-iterate ang bawat cart item para i-copy at kalkulahin ang orderTotal at totalCupQuantity.
// Space Complexity: O(n) - lumilikha ng bagong orderedItems array na may sukat na n items mula sa cart.
export function buildWalkinOrder(cart, paymentMethod, orderType, branch){
    let orderTotal = 0;
    let totalCupQuantity = 0;
    const orderId = createOrderId();

    const orderedItems = [];
    for(let i = 0; i < cart.length; i++){
        orderedItems[orderedItems.length] = cart[i];
        orderTotal += cart[i].lineTotal;
        totalCupQuantity += cart[i].quantity;
    }

    return {
        orderId: orderId,
        customerId: "WALK-IN",
        orderType,
        orderSource: "Walk-in",
        branch: branch,
        orderStatus: "Confirmed",
        paymentStatus: paymentMethod === "Cash" ? "Paid (Cashier)" : "Paid (Demo)",
        paymentConfirmedAt: new Date().toISOString(),
        paymentVerification: paymentMethod === "Cash" ? "cashier-confirmation" : "demo-confirmation",
        paymentMethod: paymentMethod,
        orderedItems: orderedItems,
        orderTotal: orderTotal,
        totalCupQuantity: totalCupQuantity,
        createdAt: new Date().toLocaleString()
    };
}

// Tinatawag kapag pinindot ng admin/cashier ang Confirm Order button sa Walk-in Cart.
// Awtomatikong ipinapasok ang order sa POS Order Queue.
// Time Complexity: O(n) - kung saan n ay bilang ng cart items at render functions.
// Space Complexity: O(n) - nag-aallocate ng bagong order structure na may sukat na proporsyonal sa n items.
export function checkoutWalkinCart(){
    const paymentSelect = getElement("#adminPaymentMethodForOrder");
    const orderTypeSelect = getElement("#adminOrderType");
    const messageText = getElement("#adminOrderMessage");
    const paymentMethod = paymentSelect ? paymentSelect.value : "";
    const orderType = orderTypeSelect ? orderTypeSelect.value : "";

    if(walkinCartDetails.length === 0 || (paymentMethod !== "Cash" && !isCashlessPaymentMethod(paymentMethod)) ||
        (orderType !== "Takeout" && orderType !== "Dine In")){
        if(messageText){
            messageText.textContent = "Please add an item, select payment, and choose Takeout or Dine In.";
        } else {
            alert("Please add an item, select payment, and choose Takeout or Dine In.");
        }
        return;
    }

    for(let i = 0; i < walkinCartDetails.length; i++){
        if(!isCartItemAvailable(getActiveCashierBranch(), walkinCartDetails[i])){
            if(messageText) messageText.textContent = "An item is no longer available at this branch. Remove it before checkout.";
            return;
        }
    }

    const order = buildWalkinOrder(walkinCartDetails, paymentMethod, orderType, getActiveCashierBranch());

    // 1. Awtomatikong ilagay sa Order Queue para sa preparation!
    orderQueueDetails[orderQueueDetails.length] = order;
    // 3. I-clear ang walk-in cart
    clearWalkinCart();

    // 4. I-reset ang payment dropdown
    if(paymentSelect){
        paymentSelect.value = "";
    }
    if(orderTypeSelect) orderTypeSelect.value = "";

    // 5. I-update ang walk-in cart display sa screen
    renderWalkinCart();

    // 6. I-update ang Order Queue display
    renderOrderQueue();

    if(messageText){
        messageText.textContent = (paymentMethod === "Cash" ? "Cash order" : "Demo payment") + " confirmed in the " + order.branch + " queue (" + order.orderId + ").";
    } else {
        alert("Walk-in order confirmed and added to queue (" + order.orderId + ")!");
    }
}
