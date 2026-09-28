import { getElement, formatToppings, escapeHTML } from "../general/helper.js";
import { orderDetails, orderQueueDetails, orderLogsDetails, getOrderBranch, getOrderType } from "../general/orderStore.js";
import { renderOrderLogs } from "../cashier/orderLogs.js";
import { renderCancellations } from "../cashier/cancellations.js";
import { indexOfValue, removeItemAt } from "../general/arrayOps.js";

export { orderDetails } from "../general/orderStore.js";

const expandedOrders = [];

export function toggleOrderDetails(orderId){
    let exists = false;
    for(let i = 0; i < orderDetails.length; i++){
        if(orderDetails[i].orderId === orderId){
            exists = true;
            break;
        }
    }
    if(!exists) return;
    const expandedIndex = indexOfValue(expandedOrders, orderId);
    if(expandedIndex >= 0) removeItemAt(expandedOrders, expandedIndex);
    else expandedOrders[expandedOrders.length] = orderId;
    renderOrderStatus();
}

export function cancelCustomerOrder(orderId){
    let order = null;
    for(let i = 0; i < orderDetails.length; i++){
        if(orderDetails[i].orderId === orderId){
            order = orderDetails[i];
            break;
        }
    }
    if(!order || order.orderStatus !== "Pending Confirmation") return false;
    order.orderStatus = "Cancellation Pending";
    order.paymentStatus = "Refund Pending (Demo)";
    order.cancelledAt = new Date().toISOString();
    order.refundDueAt = new Date(Date.now() + 60_000).toISOString();
    let queueIndex = -1;
    for(let i = 0; i < orderQueueDetails.length; i++){
        if(orderQueueDetails[i].orderId === orderId){
            queueIndex = i;
            break;
        }
    }
    if(queueIndex >= 0) removeItemAt(orderQueueDetails, queueIndex);
    let alreadyLogged = false;
    for(let i = 0; i < orderLogsDetails.length; i++){
        if(orderLogsDetails[i] === order){
            alreadyLogged = true;
            break;
        }
    }
    if(!alreadyLogged) orderLogsDetails[orderLogsDetails.length] = order;
    const expandedIndex = indexOfValue(expandedOrders, orderId);
    if(expandedIndex >= 0) removeItemAt(expandedOrders, expandedIndex);
    const confirmation = getElement("#checkoutConfirmation");
    if(confirmation && containsText(confirmation.textContent, orderId)){
        const summary = getElement("#checkoutSummarySection");
        if(summary) summary.style.display = "none";
    }
    renderOrderStatus();
    renderOrderLogs();
    renderCancellations();
    setTimeout(() => completeCancellation(order), 60_000);
    return true;
}

function containsText(text, fragment){
    for(let i = 0; i <= text.length - fragment.length; i++){
        let matched = true;
        for(let j = 0; j < fragment.length; j++){
            if(text[i + j] !== fragment[j]){
                matched = false;
                break;
            }
        }
        if(matched) return true;
    }
    return false;
}

export function completeCancellation(order){
    if(order.orderStatus !== "Cancellation Pending") return false;
    order.orderStatus = "Cancelled";
    order.paymentStatus = "Refund Completed (Demo)";
    order.refundCompletedAt = new Date().toISOString();
    renderOrderStatus();
    renderOrderLogs();
    renderCancellations();
    return true;
}

function buildDetailRow(order, index, columnCount){
    const detailsId = `order-details-${index}`;
    const hidden = indexOfValue(expandedOrders, order.orderId) >= 0 ? "" : " hidden";
    let html = `<tr id="${detailsId}" class="orderDetailsRow"${hidden}><td colspan="${columnCount}">`;
    html += `<dl class="orderDetailsContent">`;
    html += `<div class="orderDetail"><dt>Branch</dt><dd>${escapeHTML(getOrderBranch(order))}</dd></div>`;
    html += `<div class="orderDetail"><dt>Order type</dt><dd>${escapeHTML(getOrderType(order))}</dd></div>`;
    html += `<div class="orderDetail"><dt>Payment method</dt><dd>${escapeHTML(order.paymentMethod)}</dd></div>`;
    html += `<div class="orderDetail"><dt>Payment status</dt><dd>${escapeHTML(order.paymentStatus)}</dd></div>`;
    html += `<div class="orderDetail"><dt>Placed</dt><dd>${escapeHTML(order.createdAt)}</dd></div>`;
    html += `<div class="orderDetail"><dt>Total cups</dt><dd>${escapeHTML(order.totalCupQuantity)}</dd></div>`;
    html += `<div class="orderDetail orderDetailTotal"><dt>Order total</dt><dd>Php ${escapeHTML(order.orderTotal)}</dd></div>`;
    html += `</dl>`;
    return html + "</td></tr>";
}

export function renderOrderStatus(){
    const container = getElement("#orderStatusContainer");
    const empty = getElement("#orderStatusEmpty");
    if(!container || !empty) return;

    empty.style.display = orderDetails.length ? "none" : "block";
    if(orderDetails.length === 0){
        container.innerHTML = "";
        return;
    }

    let showActions = false;
    for(let i = 0; i < orderDetails.length; i++){
        if(orderDetails[i].orderStatus === "Pending Confirmation"){
            showActions = true;
            break;
        }
    }
    let html = `<div class="orderStatusTableWrap"><table class="orderSummaryTable statusTable">
        <thead><tr><th>Order ID</th><th>Cup</th><th>Qty</th><th>Toppings</th><th>Add-ons</th><th>Line Total</th><th>Status</th>${showActions ? "<th>Action</th>" : ""}</tr></thead><tbody>`;

    for(let index = orderDetails.length - 1; index >= 0; index--){
        const order = orderDetails[index];
        const rowCount = order.orderedItems.length;
        const detailsId = `order-details-${index}`;
        const isOpen = indexOfValue(expandedOrders, order.orderId) >= 0;

        for(let itemIndex = 0; itemIndex < rowCount; itemIndex++){
            const item = order.orderedItems[itemIndex];
            const addOns = (item.extraToppingTotal + item.premiumToppingTotal + item.plainFroyoAddOn) * item.quantity;
            html += "<tr>";
            if(itemIndex === 0){
                html += `<td rowspan="${rowCount}" class="statusOrderId"><button type="button" class="orderDetailsToggle" data-toggle-order="${escapeHTML(order.orderId)}" aria-expanded="${isOpen}" aria-controls="${detailsId}" aria-label="${isOpen ? "Hide" : "Show"} details for ${escapeHTML(order.orderId)}">${isOpen ? "&#9662;" : "&#9656;"}</button> <b>${escapeHTML(order.orderId)}</b></td>`;
            }
            html += `<td>${escapeHTML(item.cupDetails.cupName)}</td>`;
            html += `<td>${escapeHTML(item.quantity)}</td>`;
            html += `<td>${formatToppings(item.selectedToppings)}</td>`;
            html += `<td>Php ${escapeHTML(addOns)}</td>`;
            html += `<td>Php ${escapeHTML(item.lineTotal)}</td>`;
            if(itemIndex === 0){
                const canCancel = order.orderStatus === "Pending Confirmation";
                html += `<td rowspan="${rowCount}"${showActions && !canCancel ? ' colspan="2"' : ""}><span class="statusBadge">${escapeHTML(order.orderStatus)}</span></td>`;
                if(canCancel){
                    html += `<td rowspan="${rowCount}"><button type="button" class="cancelOrderButton" data-cancel-order="${escapeHTML(order.orderId)}">Cancel Order</button></td>`;
                }
            }
            html += "</tr>";
        }
        html += buildDetailRow(order, index, showActions ? 8 : 7);
    }

    container.innerHTML = html + "</tbody></table></div>";
}
