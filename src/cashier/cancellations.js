import { getElement, escapeHTML } from "../general/helper.js";
import { orderLogsDetails, getActiveCashierBranch, getOrderBranch } from "../general/orderStore.js";

export function renderCancellations(){
    const container = getElement("#cancellationsContainer");
    if(!container) return;

    const cancellations = [];
    for(let i = 0; i < orderLogsDetails.length; i++){
        const order = orderLogsDetails[i];
        if(getOrderBranch(order) === getActiveCashierBranch() &&
            (order.orderStatus === "Cancellation Pending" || order.orderStatus === "Cancelled")){
            cancellations[cancellations.length] = order;
        }
    }
    if(cancellations.length === 0){
        container.innerHTML = "<p>No cancellations for this branch yet.</p>";
        return;
    }

    let html = `<div class="queueScroll"><table class="orderSummaryTable cancellationTable">
        <thead><tr><th>Order ID</th><th>Cancelled</th><th>Payment Method</th><th>Amount</th><th>Cancellation Status</th><th>Refund Status</th><th>Refund Completed</th></tr></thead><tbody>`;
    for(const order of cancellations){
        html += `<tr><td><b>${escapeHTML(order.orderId)}</b></td>`;
        html += `<td>${escapeHTML(order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : "")}</td>`;
        html += `<td>${escapeHTML(order.paymentMethod)}</td>`;
        html += `<td>Php ${escapeHTML(order.orderTotal)}</td>`;
        html += `<td><span class="statusBadge">${escapeHTML(order.orderStatus)}</span></td>`;
        html += `<td>${escapeHTML(order.paymentStatus)}</td>`;
        html += `<td>${escapeHTML(order.refundCompletedAt ? new Date(order.refundCompletedAt).toLocaleString() : "Pending")}</td></tr>`;
    }
    container.innerHTML = html + "</tbody></table></div>";
}
