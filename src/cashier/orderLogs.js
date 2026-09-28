import { getElement, formatToppings, escapeHTML } from "../general/helper.js";
import { orderLogsDetails, getActiveCashierBranch, getOrderBranch, getOrderType } from "../general/orderStore.js";
import { indexOfValue, removeItemAt } from "../general/arrayOps.js";

// Array store para sa completed at cancelled orders.
// Time Complexity: O(1) - direct access.
// Space Complexity: O(n) - kung saan n ay bilang ng completed orders.
export { orderLogsDetails } from "../general/orderStore.js";

const expandedLogOrders = [];

// Nagdadagdag ng completed order sa logs
// Time Complexity: O(1)
// Space Complexity: O(1)
export function addOrderLog(order){
    orderLogsDetails[orderLogsDetails.length] = order;
}

// Bumubuo ng table rows para sa Order Logs — katulad ng format sa Order Queue.
// Time Complexity: O(n) - kung saan n ay bilang ng items sa order.
// Space Complexity: O(n) - lumilikha ng HTML string na proporsyonal sa dami ng items.
function buildLogRows(order, index){
    let html = "";
    const rowCount = order.orderedItems.length;
    const detailsId = `log-details-${index}`;
    const isOpen = indexOfValue(expandedLogOrders, order.orderId) >= 0;

    for(let itemIndex = 0; itemIndex < order.orderedItems.length; itemIndex++){
        const item = order.orderedItems[itemIndex];
        html += "<tr>";

        if(itemIndex === 0){
            html += "<td rowspan=\"" + rowCount + "\">" + (index + 1) + "</td>";
            html += `<td rowspan="${rowCount}"><button type="button" class="orderDetailsToggle" data-log-details="${escapeHTML(order.orderId)}" aria-expanded="${isOpen}" aria-controls="${detailsId}" aria-label="${isOpen ? "Hide" : "Show"} details for ${escapeHTML(order.orderId)}">${isOpen ? "&#9662;" : "&#9656;"}</button> <b>${escapeHTML(order.orderId)}</b></td>`;
        }

        html += "<td>" + escapeHTML(item.cupDetails.cupName) + "</td>";
        html += "<td>" + escapeHTML(item.quantity) + "</td>";
        html += "<td>" + formatToppings(item.selectedToppings) + "</td>";
        html += "<td>Php " + escapeHTML(item.lineTotal) + "</td>";

        if(itemIndex === 0){
            html += "<td rowspan=\"" + rowCount + "\">" + escapeHTML(order.paymentMethod || order.paymentStatus) + "<br><small>" + escapeHTML(order.paymentStatus) + "</small></td>";
            html += "<td rowspan=\"" + rowCount + "\"><span class=\"statusBadge\">" + escapeHTML(order.orderStatus) + "</span></td>";
        }

        html += "</tr>";
    }

    html += `<tr id="${detailsId}" class="orderDetailsRow"${isOpen ? "" : " hidden"}><td colspan="8"><dl class="orderDetailsContent"><div class="orderDetail"><dt>Order type</dt><dd>${escapeHTML(getOrderType(order))}</dd></div><div class="orderDetail"><dt>Order date</dt><dd>${escapeHTML(order.createdAt)}</dd></div></dl></td></tr>`;

    return html;
}

// Bumubuo ng kumpletong HTML table para sa Order Logs.
// Time Complexity: O(n^2) - nested loop sa pag-ikot sa lahat ng orders at bawat item.
// Space Complexity: O(n) - lumilikha ng buong table HTML string.
function buildLogsTable(logs){
    let html = "<div class=\"queueTableWrap\"><table class=\"orderSummaryTable queueTable\">";
    html += "<thead><tr>";
    html += "<th>No.</th><th>Order ID</th><th>Cup Size</th><th>Quantity</th>";
    html += "<th>Toppings</th><th>Total</th><th>Mode of Payment</th><th>Status</th>";
    html += "</tr></thead><tbody>";

    for(let i = 0; i < logs.length; i++){
        html += buildLogRows(logs[i], i);
    }

    html += "</tbody></table></div>";
    return html;
}

// Nire-render ang Order Logs table sa loob ng #orderLogsContainer.
// Time Complexity: O(n^2) - tinatawag ang buildLogsTable O(n^2) at ini-inject sa DOM.
// Space Complexity: O(n) - nag-iimbak ng table HTML string bago i-render.
export function renderOrderLogs(){
    const container = getElement("#orderLogsContainer");
    const countText = getElement("#orderLogsCount");

    if(!container) return;

    const branchLogs = [];
    for(let i = 0; i < orderLogsDetails.length; i++){
        const order = orderLogsDetails[i];
        if(getOrderBranch(order) === getActiveCashierBranch()) branchLogs[branchLogs.length] = order;
    }
    if(branchLogs.length === 0){
        container.innerHTML = "<p>No transaction logs yet.</p>";
        if(countText) countText.textContent = "";
        return;
    }

    if(countText){
        countText.textContent = "Showing " + branchLogs.length + " transaction" + (branchLogs.length > 1 ? "s" : "") + ".";
    }

    container.innerHTML = buildLogsTable(branchLogs);
}

export function initOrderLogs(){
    const container = getElement("#orderLogsContainer");
    if(!container) return;
    container.addEventListener("click", event => {
        const toggle = event.target.closest("button[data-log-details]");
        if(!toggle || !container.contains(toggle)) return;
        const orderId = toggle.dataset.logDetails;
        const expandedIndex = indexOfValue(expandedLogOrders, orderId);
        if(expandedIndex >= 0) removeItemAt(expandedLogOrders, expandedIndex);
        else expandedLogOrders[expandedLogOrders.length] = orderId;
        renderOrderLogs();
    });
}
