import { getElement, formatToppings, escapeHTML } from "../general/helper.js";
import { orderQueueDetails, orderLogsDetails, getActiveCashierBranch, getOrderBranch, getOrderType } from "../general/orderStore.js";
import { renderOrderStatus } from "../customer/orderStatus.js";
import { renderOrderLogs } from "./orderLogs.js";
import { isCashlessPaymentMethod } from "../general/demoPayment.js";
import { indexOfValue, removeItemAt } from "../general/arrayOps.js";

export { orderQueueDetails } from "../general/orderStore.js";

const expandedQueueOrders = [];

const nextAction = {
    "Pending Confirmation": ["Confirm Order", "Confirmed"],
    "Confirmed": ["Start Preparing", "Preparing"],
    "Preparing": ["Mark Ready", null],
    "Ready for Takeout": ["Completed", "Completed"],
    "Ready to Serve": ["Completed", "Completed"],
    "Ready for Pickup": ["Completed", "Completed"],
    "Ready for Delivery": ["Completed", "Completed"]
};

function hasConfirmedPayment(order){
    return order.paymentStatus === "Paid" || order.paymentStatus === "Paid (Demo)" || order.paymentStatus === "Paid (Cashier)";
}

function getQueueAction(order){
    if(hasConfirmedPayment(order)) return nextAction[order.orderStatus];
    if(order.paymentStatus === "Pending Payment" && isCashlessPaymentMethod(order.paymentMethod)){
        return ["Confirm Demo Payment", "Demo Payment"];
    }
    return null;
}

export function buildQueueTable(queue){
    let html = "<div class=\"queueTableWrap\"><table class=\"orderSummaryTable queueTable\">";
    html += "<thead><tr><th>No.</th><th>Order ID</th><th>Cup Size</th><th>Quantity</th><th>Toppings</th><th>Add-ons</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead><tbody>";

    for(let index = 0; index < queue.length; index++){
        const order = queue[index];
        const rowCount = order.orderedItems.length;
        const action = getQueueAction(order);
        const detailsId = `queue-details-${index}`;
        const isOpen = indexOfValue(expandedQueueOrders, order.orderId) >= 0;
        for(let itemIndex = 0; itemIndex < rowCount; itemIndex++){
            const item = order.orderedItems[itemIndex];
            const addOns = (item.extraToppingTotal + item.premiumToppingTotal + item.plainFroyoAddOn) * item.quantity;
            html += "<tr>";
            if(itemIndex === 0){
                html += "<td rowspan=\"" + rowCount + "\">" + (index + 1) + "</td>";
                html += `<td rowspan="${rowCount}"><button type="button" class="orderDetailsToggle" data-queue-details="${escapeHTML(order.orderId)}" aria-expanded="${isOpen}" aria-controls="${detailsId}" aria-label="${isOpen ? "Hide" : "Show"} details for ${escapeHTML(order.orderId)}">${isOpen ? "&#9662;" : "&#9656;"}</button> <b>${escapeHTML(order.orderId)}</b></td>`;
            }
            html += "<td>" + escapeHTML(item.cupDetails.cupName) + "</td>";
            html += "<td>" + escapeHTML(item.quantity) + "</td>";
            html += "<td>" + formatToppings(item.selectedToppings) + "</td>";
            html += "<td>Php " + escapeHTML(addOns) + "</td>";
            html += "<td>Php " + escapeHTML(item.lineTotal) + "</td>";
            if(itemIndex === 0){
                html += "<td rowspan=\"" + rowCount + "\">" + escapeHTML(order.paymentMethod) + "<br><small>" + escapeHTML(order.paymentStatus) + "</small></td>";
                html += "<td rowspan=\"" + rowCount + "\"><span class=\"statusBadge\">" + escapeHTML(order.orderStatus) + "</span></td>";
                html += "<td rowspan=\"" + rowCount + "\">";
                if(index > 0) html += "<span class=\"queueWaiting\">Waiting in queue</span>";
                else if(action) html += "<button type=\"button\" class=\"queueAction\" data-order-id=\"" + escapeHTML(order.orderId) + "\">" + action[0] + "</button>";
                else if(!hasConfirmedPayment(order)) html += "Awaiting payment";
                html += "</td>";
            }
            html += "</tr>";
        }
        html += `<tr id="${detailsId}" class="orderDetailsRow"${isOpen ? "" : " hidden"}><td colspan="10"><dl class="orderDetailsContent"><div class="orderDetail"><dt>Order type</dt><dd>${escapeHTML(getOrderType(order))}</dd></div><div class="orderDetail"><dt>Order date</dt><dd>${escapeHTML(order.createdAt)}</dd></div></dl></td></tr>`;
    }

    return html + "</tbody></table></div>";
}

export function renderOrderQueue(){
    const container = getElement("#orderQueueContainer");
    const nextOrderText = getElement("#nextOrderText");
    if(!container) return;
    const branchQueue = [];
    for(let i = 0; i < orderQueueDetails.length; i++){
        const order = orderQueueDetails[i];
        if(getOrderBranch(order) === getActiveCashierBranch()) branchQueue[branchQueue.length] = order;
    }
    if(branchQueue.length === 0){
        container.innerHTML = "<p>No active queue yet.</p>";
        if(nextOrderText) nextOrderText.textContent = "No next order.";
        return;
    }
    if(nextOrderText) nextOrderText.textContent = "Next Order: " + branchQueue[0].orderId;
    container.innerHTML = buildQueueTable(branchQueue);
}

export function initOrderQueue(){
    const container = getElement("#orderQueueContainer");
    if(!container) return;
    container.addEventListener("click", event => {
        const toggle = event.target.closest("button[data-queue-details]");
        if(toggle && container.contains(toggle)){
            const orderId = toggle.dataset.queueDetails;
            const expandedIndex = indexOfValue(expandedQueueOrders, orderId);
            if(expandedIndex >= 0) removeItemAt(expandedQueueOrders, expandedIndex);
            else expandedQueueOrders[expandedQueueOrders.length] = orderId;
            renderOrderQueue();
            return;
        }
        const button = event.target.closest("button[data-order-id]");
        if(!button || !container.contains(button)) return;
        // FIFO per branch: only the first active order may advance.
        let index = -1;
        for(let i = 0; i < orderQueueDetails.length; i++){
            const candidate = orderQueueDetails[i];
            if(getOrderBranch(candidate) === getActiveCashierBranch()){
                index = i;
                break;
            }
        }
        if(index < 0 || orderQueueDetails[index].orderId !== button.dataset.orderId) return;
        const order = orderQueueDetails[index];
        const action = getQueueAction(order);
        if(!action) return;

        if(action[1] === "Demo Payment"){
            order.paymentStatus = "Paid (Demo)";
            order.paymentConfirmedAt = new Date().toISOString();
            order.paymentVerification = "demo-confirmation";
            renderOrderQueue();
            renderOrderStatus();
            return;
        }

        const isCompleted = action[1] === "Completed";
        order.orderStatus = action[1] || (getOrderType(order) === "Dine In" ? "Ready to Serve" : "Ready for Takeout");
        if(isCompleted){
            removeItemAt(orderQueueDetails, index);
            orderLogsDetails[orderLogsDetails.length] = order;
        }
        renderOrderQueue();
        renderOrderStatus();
        if(isCompleted) renderOrderLogs();
    });
    renderOrderQueue();
}
