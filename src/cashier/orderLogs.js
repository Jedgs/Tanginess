import { getElement, formatToppings } from "../general/helper.js";

// Array store para sa mga order na natapos na (Completed) mula sa Order Queue.
// Time Complexity: O(1) - direct access.
// Space Complexity: O(n) - kung saan n ay bilang ng completed orders.
export const orderLogsDetails = [];

// Nagdadagdag ng completed order sa logs (DSA manual index assignment nang walang .push()).
// Time Complexity: O(1) - direct index assignment sa dulo ng array.
// Space Complexity: O(1) - walang karagdagang memory allocation bukod sa pag-store ng order reference.
export function addOrderLog(order){
    orderLogsDetails[orderLogsDetails.length] = order;
}

// Bumubuo ng table rows para sa Order Logs — katulad ng format sa Order Queue.
// Time Complexity: O(n) - kung saan n ay bilang ng items sa order.
// Space Complexity: O(n) - lumilikha ng HTML string na proporsyonal sa dami ng items.
function buildLogRows(order, index){
    let html = "";
    const rowCount = order.orderedItems.length;

    for(let itemIndex = 0; itemIndex < order.orderedItems.length; itemIndex++){
        const item = order.orderedItems[itemIndex];
        html += "<tr>";

        if(itemIndex === 0){
            html += "<td rowspan=\"" + rowCount + "\">" + (index + 1) + "</td>";
            html += "<td rowspan=\"" + rowCount + "\"><b>" + order.orderId + "</b></td>";
        }

        html += "<td>" + item.cupDetails.cupName + "</td>";
        html += "<td>" + item.quantity + "</td>";
        html += "<td>" + formatToppings(item.selectedToppings) + "</td>";
        html += "<td>Php " + item.lineTotal + "</td>";

        if(itemIndex === 0){
            html += "<td rowspan=\"" + rowCount + "\">" + (order.paymentMethod || order.paymentStatus) + "</td>";
            html += "<td rowspan=\"" + rowCount + "\">" + order.createdAt + "</td>";
        }

        html += "</tr>";
    }

    return html;
}

// Bumubuo ng kumpletong HTML table para sa Order Logs.
// Time Complexity: O(n^2) - nested loop sa pag-ikot sa lahat ng orders at bawat item.
// Space Complexity: O(n) - lumilikha ng buong table HTML string.
function buildLogsTable(logs){
    let html = "<table class=\"orderSummaryTable queueTable\">";
    html += "<thead><tr>";
    html += "<th>No.</th><th>Order ID</th><th>Cup Size</th><th>Quantity</th>";
    html += "<th>Toppings</th><th>Total</th><th>Mode of Payment</th><th>Order Date</th>";
    html += "</tr></thead><tbody>";

    for(let i = 0; i < logs.length; i++){
        html += buildLogRows(logs[i], i);
    }

    html += "</tbody></table>";
    return html;
}

// Nire-render ang Order Logs table sa loob ng #orderLogsContainer.
// Time Complexity: O(n^2) - tinatawag ang buildLogsTable O(n^2) at ini-inject sa DOM.
// Space Complexity: O(n) - nag-iimbak ng table HTML string bago i-render.
export function renderOrderLogs(){
    const container = getElement("#orderLogsContainer");
    const countText = getElement("#orderLogsCount");

    if(!container) return;

    if(orderLogsDetails.length === 0){
        container.innerHTML = "<p>No completed orders yet.</p>";
        if(countText) countText.textContent = "";
        return;
    }

    if(countText){
        countText.textContent = "Showing " + orderLogsDetails.length + " completed order" + (orderLogsDetails.length > 1 ? "s" : "") + ".";
    }

    container.innerHTML = buildLogsTable(orderLogsDetails);
}

