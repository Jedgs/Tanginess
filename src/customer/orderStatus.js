import { getElement, buildOrderSummaryHTML } from "../general/helper.js";

// Array store para sa lahat ng confirmed orders.
export const orderDetails = [];

// Nagdadagdag ng bagong order sa listahan nang walang builtin .push() (DSA approach).
// Time Complexity: O(1) - direct assignment sa orderDetails[length].
// Space Complexity: O(1) - auxiliary space (nag-iimbak ng reference sa order object).
export function addOrder(order){
    orderDetails[orderDetails.length] = order;
}

// Nire-render ang lahat ng orders sa orderDetails sa loob ng #orderStatusContainer.
// Bawat order ay nagpapakita ng status, payment, QR ID, date, at breakdown table.
// Time Complexity: O(n^2) - nested loop sa pag-render ng mga orders at items sa table.
// Space Complexity: O(n) - lumilikha ng HTML string para sa order table.
export function renderOrderStatus(){
    const statusContainer = getElement("#orderStatusContainer");
    const statusEmpty = getElement("#orderStatusEmpty");

    if(!statusContainer || !statusEmpty){
        return;
    }

    if(orderDetails.length === 0){
        statusEmpty.style.display = "block";
        statusContainer.innerHTML = "";
        return;
    }

    statusEmpty.style.display = "none";
    let html = "";

    for(let i = 0; i < orderDetails.length; i++){
        const order = orderDetails[i];

        // Separator bago ang bawat order maliban sa una.
        if(i > 0){
            html += "<hr class=\"cartSeparator\">";
        }

        html += "<div class=\"orderStatusItem\">";
        html += "<h4>" + order.orderId + "</h4>";
        html += "<p>Status: <b>" + order.orderStatus + "</b></p>";
        html += "<p>Payment: <b>" + order.paymentStatus + "</b></p>";
        html += "<p>QR ID: " + order.qrCodeUniqueId + "</p>";
        html += "<p>Placed: " + order.createdAt + "</p>";
        html += "<p>Total Cups: " + order.totalCupQuantity + "</p>";
        html += buildOrderSummaryHTML(order);
        html += "</div>";
    }

    statusContainer.innerHTML = html;
}
