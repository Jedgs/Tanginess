import { getElement, formatToppings } from "../general/helper.js";
import { addOrderLog, renderOrderLogs } from "./orderLogs.js";

// Array store para sa mga order na kasalukuyang nasa queue ng paghahanda (POS Order Queue).
export const orderQueueDetails = [];

// Nagdadagdag ng order sa queue (DSA manual index assignment nang walang .push()).
// Time Complexity: O(1) - direct index assignment sa dulo ng array nang walang array resizing method.
// Space Complexity: O(1) - walang karagdagang memory allocation bukod sa pag-store ng order reference.
export function addQueueOrder(order){
    orderQueueDetails[orderQueueDetails.length] = order;
}

// Tinatanggal ang unang order sa queue (DSA manual shift loop nang walang .shift()).
// Time Complexity: O(n) - kung saan n ay bilang ng orders sa queue; manu-manong inililipat ang bawat element nang isang puwesto pakaliwa (shift loop).
// Space Complexity: O(1) - in-place shifting, walang karagdagang array allocation.
export function removeFirstQueueOrder(){
    if(orderQueueDetails.length === 0) return null;
    const first = orderQueueDetails[0];

    for(let i = 0; i < orderQueueDetails.length - 1; i++){
        orderQueueDetails[i] = orderQueueDetails[i + 1];
    }
    orderQueueDetails.length = orderQueueDetails.length - 1;
    return first;
}

// Kinukuha ang total add-ons ng isang cart item (extra toppings + premium + plain froyo).
// Time Complexity: O(1) - direct field lookup at addition arithmetic operation.
// Space Complexity: O(1) - constant memory para sa numeric total.
export function getAddOnTotal(item){
    return item.extraToppingTotal + item.premiumToppingTotal + item.plainFroyoAddOn;
}

// Bumabasa sa mode of payment o payment status ng order.
// Time Complexity: O(1) - direct property check at string return.
// Space Complexity: O(1) - constant memory.
function getPaymentText(order){
    if(order.paymentMethod && order.paymentMethod !== ""){
        return order.paymentMethod;
    }
    return order.paymentStatus;
}

// Bumubuo ng table rows katulad ng sa Tanginess module (queueView.js).
// Gumagamit ng rowspan para magkakasama ang items ng iisang order.
// Time Complexity: O(n) - kung saan n ay bilang ng items sa order; ini-iterate ang bawat item sa loob ng order para gumawa ng table rows.
// Space Complexity: O(n) - lumilikha ng HTML string na proporsyonal sa dami ng items.
function buildQueueRows(order, index){
    let html = "";
    const rowCount = order.orderedItems.length;
    const disabled = index === 0 ? "" : "disabled";

    for(let itemIndex = 0; itemIndex < order.orderedItems.length; itemIndex++){
        const item = order.orderedItems[itemIndex];
        html += "<tr>";

        // Unang linya ng order: ipakita ang No. at Order ID
        if(itemIndex === 0){
            html += "<td rowspan=\"" + rowCount + "\">" + (index + 1) + "</td>";
            html += "<td rowspan=\"" + rowCount + "\"><b>" + order.orderId + "</b></td>";
        }

        // Bawat cup item sa loob ng order
        html += "<td>" + item.cupDetails.cupName + "</td>";
        html += "<td>" + item.quantity + "</td>";
        html += "<td>" + formatToppings(item.selectedToppings) + "</td>";
        html += "<td>Php " + getAddOnTotal(item) + "</td>";
        html += "<td>Php " + item.lineTotal + "</td>";

        // Unang linya ng order: ipakita ang Payment, Date, Status, at Action
        if(itemIndex === 0){
            html += "<td rowspan=\"" + rowCount + "\">" + getPaymentText(order) + "</td>";
            html += "<td rowspan=\"" + rowCount + "\">" + order.createdAt + "</td>";
            html += "<td rowspan=\"" + rowCount + "\"><span class=\"statusBadge\">" + order.orderStatus + "</span></td>";
            html += "<td rowspan=\"" + rowCount + "\"><button type=\"button\" class=\"btnCompleteOrder\" data-complete=\"" + order.orderId + "\" " + disabled + ">Completed</button></td>";
        }

        html += "</tr>";
    }

    return html;
}

// Bumubuo ng kumpletong HTML table para sa Order Queue.
// Time Complexity: O(n^2) - nested loop sa pag-ikot sa lahat ng orders at bawat item sa queue.
// Space Complexity: O(n) - lumilikha ng buong table HTML string na naglalaman ng lahat ng orders.
export function buildQueueTable(queue){
    let html = "<table class=\"orderSummaryTable queueTable\">";
    html += "<thead><tr><th>No.</th><th>Order ID</th><th>Cup Size</th><th>Quantity</th><th>Toppings</th><th>Add-ons</th><th>Total</th><th>Mode of Payment</th><th>Order Date</th><th>Status</th><th>Action</th></tr></thead><tbody>";

    for(let i = 0; i < queue.length; i++){
        html += buildQueueRows(queue[i], i);
    }

    html += "</tbody></table>";
    return html;
}

// Nire-render ang buong POS Order Queue sa loob ng #orderQueueContainer.
// Time Complexity: O(n^2) - tinatawag ang buildQueueTable O(n^2) at i-in-inject sa DOM.
// Space Complexity: O(n) - nag-iimbak ng table HTML string bago i-render.
export function renderOrderQueue(){
    const container = getElement("#orderQueueContainer");
    const nextOrderText = getElement("#nextOrderText");

    if(!container) return;

    if(orderQueueDetails.length === 0){
        container.innerHTML = "<p>No active queue yet.</p>";
        if(nextOrderText){
            nextOrderText.innerHTML = "No next order.";
        }
        return;
    }

    if(nextOrderText){
        nextOrderText.innerHTML = "<b>Next Order:</b> " + orderQueueDetails[0].orderId;
    }

    container.innerHTML = buildQueueTable(orderQueueDetails);
}

// Setup ng listener para sa "Completed" button sa table.
// Kapag natapos ang order, inaalis ito sa active queue (FIFO queue principle).
// Time Complexity: O(1) para sa listener setup, at O(n^2) kapag na-click ang completed button dahil sa renderOrderQueue.
// Space Complexity: O(1) - event callback reference memory.
export function initOrderQueue(){
    const container = getElement("#orderQueueContainer");
    if(!container) return;

    container.addEventListener("click", (event)=>{
        const completeId = event.target.getAttribute("data-complete");
        if(completeId === null || orderQueueDetails.length === 0) return;

        // Markahan bilang Completed bago alisin
        orderQueueDetails[0].orderStatus = "Completed";

        // Ilipat sa Order Logs bago alisin sa queue
        addOrderLog(orderQueueDetails[0]);

        removeFirstQueueOrder();
        renderOrderQueue();
        renderOrderLogs();
    });

    renderOrderQueue();
}

