import { walkinCartDetails, clearWalkinCart, renderWalkinCart } from "../general/addToCart.js";
import { addQueueOrder, renderOrderQueue } from "./orderQueue.js";
import { getElement } from "../general/helper.js";

let nextWalkinOrderId = 2001;

// Gumagawa ng walk-in order object mula sa laman ng walk-in cart (DSA accumulation).
// Time Complexity: O(n) - kung saan n ay bilang ng cart items; ini-iterate ang bawat cart item para i-copy at kalkulahin ang orderTotal at totalCupQuantity.
// Space Complexity: O(n) - lumilikha ng bagong orderedItems array na may sukat na n items mula sa cart.
export function buildWalkinOrder(cart, paymentMethod){
    let orderTotal = 0;
    let totalCupQuantity = 0;
    const orderId = "ORD-" + nextWalkinOrderId;

    const orderedItems = [];
    for(let i = 0; i < cart.length; i++){
        orderedItems[orderedItems.length] = cart[i];
        orderTotal += cart[i].lineTotal;
        totalCupQuantity += cart[i].quantity;
    }

    return {
        orderId: orderId,
        customerId: "WALK-IN",
        orderType: "Walk-in",
        orderStatus: "Pending Preparation",
        paymentStatus: "Paid",
        paymentMethod: paymentMethod,
        orderedItems: orderedItems,
        orderTotal: orderTotal,
        totalCupQuantity: totalCupQuantity,
        qrCodeUniqueId: "",
        createdAt: new Date().toLocaleString()
    };
}

// Tinatawag kapag pinindot ng admin/cashier ang Confirm Order button sa Walk-in Cart.
// Awtomatikong ipinapasok ang order sa POS Order Queue.
// Time Complexity: O(n) - kung saan n ay bilang ng cart items; tinatawag ang buildWalkinOrder O(n), addQueueOrder O(1), at render functions.
// Space Complexity: O(n) - nag-aallocate ng bagong order structure na may sukat na proporsyonal sa n items.
export function checkoutWalkinCart(){
    const paymentSelect = getElement("#adminPaymentMethodForOrder");
    const messageText = getElement("#adminOrderMessage");
    const paymentMethod = paymentSelect ? paymentSelect.value : "";

    if(walkinCartDetails.length === 0 || paymentMethod === ""){
        if(messageText){
            messageText.textContent = "Please add an item and select payment method first.";
        } else {
            alert("Please add an item and select payment method first.");
        }
        return;
    }

    const order = buildWalkinOrder(walkinCartDetails, paymentMethod);

    // 1. Awtomatikong ilagay sa Order Queue para sa preparation!
    addQueueOrder(order);

    // 2. Increment ID para sa susunod na walk-in customer
    nextWalkinOrderId++;

    // 3. I-clear ang walk-in cart
    clearWalkinCart();

    // 4. I-reset ang payment dropdown
    if(paymentSelect){
        paymentSelect.value = "";
    }

    // 5. I-update ang walk-in cart display sa screen
    renderWalkinCart();

    // 6. I-update ang Order Queue display
    renderOrderQueue();

    if(messageText){
        messageText.textContent = "Walk-in order confirmed and added to queue (" + order.orderId + ").";
    } else {
        alert("Walk-in order confirmed and added to queue (" + order.orderId + ")!");
    }
}

