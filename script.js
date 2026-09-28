import { initOrderView, refreshCustomerOrderMenu, refreshAdminOrderMenu } from "./src/general/orderView.js";
import { productCustomerCart, productWalkinCart, renderCustomerCart, renderWalkinCart, removeCartItem, customerCartDetails, walkinCartDetails } from "./src/general/addToCart.js";
import { checkoutCustomerCart } from "./src/customer/customerCheckOutOrder.js";
import { checkoutWalkinCart } from "./src/cashier/walkinCheckOutOrder.js";
import { renderOrderStatus, cancelCustomerOrder, toggleOrderDetails } from "./src/customer/orderStatus.js";
import { initOrderQueue, renderOrderQueue } from "./src/cashier/orderQueue.js";
import { initOrderLogs, renderOrderLogs } from "./src/cashier/orderLogs.js";
import { renderCancellations } from "./src/cashier/cancellations.js";
import { getElement } from "./src/general/helper.js";
import { isCashlessPaymentMethod, renderDemoPayment } from "./src/general/demoPayment.js";
import { isValidBranch, setActiveCashierBranch, getActiveCashierBranch } from "./src/general/orderStore.js";
import { copyItems } from "./src/general/arrayOps.js";

let currentView = "Customer";
let currentCustomerTab = "Order";
let currentAdminTab = "Walkin";
let currentCustomerBranch = "";
const customerCarts = { Malolos: [], Pulilan: [] };
const walkinCarts = { Malolos: [], Pulilan: [] };

function switchCustomerCart(branch){
    if(isValidBranch(currentCustomerBranch)) customerCarts[currentCustomerBranch] = copyItems(customerCartDetails);
    currentCustomerBranch = branch;
    customerCartDetails.length = 0;
    for(const item of customerCarts[branch] || []) customerCartDetails[customerCartDetails.length] = item;
    renderCustomerCart();
    refreshCustomerPayment();
}

function rememberWalkinCart(){
    if(currentView === "Cashier") walkinCarts[getActiveCashierBranch()] = copyItems(walkinCartDetails);
}

function restoreWalkinCart(branch){
    walkinCartDetails.length = 0;
    for(const item of walkinCarts[branch]) walkinCartDetails[walkinCartDetails.length] = item;
    renderWalkinCart();
    refreshAdminPayment();
}

function refreshCustomerPayment(){
    renderDemoPayment("customer", getElement("#customerPaymentMethod").value, customerCartDetails);
}

function refreshAdminPayment(){
    const method = getElement("#adminPaymentMethodForOrder").value;
    renderDemoPayment("admin", method, walkinCartDetails);
    getElement("#adminConfirmWalkInOrderButton").textContent = isCashlessPaymentMethod(method)
        ? "Confirm Demo Payment & Place Order"
        : method === "Cash" ? "Confirm Cash Order" : "Confirm Order";
}

function setupCartRemoval(selector, cart, renderCart, refreshPayment){
    const container = getElement(selector);
    container.addEventListener("click", event => {
        const button = event.target.closest("button[data-remove-cart]");
        if(!button || !container.contains(button)) return;
        if(removeCartItem(cart, Number(button.dataset.removeCart))){
            renderCart();
            refreshPayment();
        }
    });
}

function switchCustomerTab(tabName){
    currentCustomerTab = tabName;
    const branchSection = getElement("#branchSelectionSection");
    const orderTab = getElement("#customerOrderTab");
    const statusSection = getElement("#orderStatusSection");
    const branch = getElement("#customerBranch")?.value;
    if(!branchSection || !orderTab || !statusSection) return;

    branchSection.style.display = tabName === "Order" ? "block" : "none";
    orderTab.style.display = tabName === "Order" && isValidBranch(branch) ? "block" : "none";
    statusSection.style.display = tabName === "Status" ? "block" : "none";
    if(tabName === "Status"){
        renderOrderStatus();
        statusSection.scrollIntoView({ behavior: "smooth" });
    }
}

function switchAdminTab(tabName){
    currentAdminTab = tabName;
    const walkinTab = getElement("#adminOrderTab");
    const queueTab = getElement("#adminQueueTab");
    const logsTab = getElement("#adminLogsTab");
    const cancellationsTab = getElement("#adminCancellationsTab");
    if(!walkinTab || !queueTab || !logsTab || !cancellationsTab) return;
    walkinTab.style.display = tabName === "Walkin" ? "block" : "none";
    queueTab.style.display = tabName === "Queue" ? "block" : "none";
    logsTab.style.display = tabName === "Logs" ? "block" : "none";
    cancellationsTab.style.display = tabName === "Cancellations" ? "block" : "none";
    if(tabName === "Queue") renderOrderQueue();
    if(tabName === "Logs") renderOrderLogs();
    if(tabName === "Cancellations") renderCancellations();
}

function showCustomer(){
    rememberWalkinCart();
    currentView = "Customer";
    getElement("#customerView").style.display = "block";
    getElement("#adminView").style.display = "none";
    switchCustomerTab("Order");
}

function showCashier(branch){
    if(!isValidBranch(branch)) return;
    rememberWalkinCart();
    setActiveCashierBranch(branch);
    currentView = "Cashier";
    refreshAdminOrderMenu();
    restoreWalkinCart(branch);
    getElement("#customerView").style.display = "none";
    getElement("#adminView").style.display = "block";
    getElement("#cashierHeading").textContent = `Tanginess Cashier — ${branch}`;
    getElement("#cashierQueueHeading").textContent = `${branch} Order Queue`;
    getElement("#cashierLogsHeading").textContent = `${branch} Order Logs`;
    getElement("#cashierCancellationsHeading").textContent = `${branch} Cancellations`;
    getElement("#switchToOtherCashierButton").textContent = `Switch to Cashier ${branch === "Malolos" ? "Pulilan" : "Malolos"}`;
    getElement("#adminOrderMessage").textContent = "";
    getElement("#adminPaymentMethodForOrder").value = "";
    getElement("#adminOrderType").value = "";
    refreshAdminPayment();
    renderOrderQueue();
    renderOrderLogs();
    renderCancellations();
    switchAdminTab(currentAdminTab);
}

function init(){
    initOrderView();
    renderCustomerCart();
    renderWalkinCart();
    setupCartRemoval(".cartContainer", customerCartDetails, renderCustomerCart, refreshCustomerPayment);
    setupCartRemoval("#adminCartContainer", walkinCartDetails, renderWalkinCart, refreshAdminPayment);
    refreshCustomerPayment();
    refreshAdminPayment();
    initOrderQueue();
    initOrderLogs();

    getElement("#customerPaymentMethod").addEventListener("change", refreshCustomerPayment);
    getElement("#adminPaymentMethodForOrder").addEventListener("change", refreshAdminPayment);

    getElement("#customerBranch").addEventListener("change", () => {
        const branch = getElement("#customerBranch").value;
        switchCustomerCart(branch);
        refreshCustomerOrderMenu();
        getElement("#branchSelectionHint").textContent = isValidBranch(branch)
            ? `Your order will go to the ${branch} cashier.`
            : "Choose where your order will be prepared.";
        switchCustomerTab("Order");
    });
    getElement("#switchToMalolosCashierButton").addEventListener("click", () => showCashier("Malolos"));
    getElement("#switchToPulilanCashierButton").addEventListener("click", () => showCashier("Pulilan"));
    getElement("#switchToCustomerButton").addEventListener("click", showCustomer);
    getElement("#switchToOtherCashierButton").addEventListener("click", () => {
        showCashier(getActiveCashierBranch() === "Malolos" ? "Pulilan" : "Malolos");
    });
    getElement("#btnCreateOrder").addEventListener("click", () => switchCustomerTab("Order"));
    getElement("#btnOrderStatus").addEventListener("click", () => switchCustomerTab("Status"));
    getElement("#orderStatusContainer").addEventListener("click", event => {
        const toggle = event.target.closest("button[data-toggle-order]");
        if(toggle){
            toggleOrderDetails(toggle.dataset.toggleOrder);
            return;
        }
        const button = event.target.closest("button[data-cancel-order]");
        if(!button) return;
        if(cancelCustomerOrder(button.dataset.cancelOrder)) renderOrderQueue();
    });
    getElement("#btnAdminWalkInOrder").addEventListener("click", () => switchAdminTab("Walkin"));
    getElement("#btnAdminQueue").addEventListener("click", () => switchAdminTab("Queue"));
    getElement("#btnAdminLogs").addEventListener("click", () => switchAdminTab("Logs"));
    getElement("#btnAdminCancellations").addEventListener("click", () => switchAdminTab("Cancellations"));
    getElement("#btnAddToCart").addEventListener("click", () => { productCustomerCart(); refreshCustomerPayment(); });
    getElement("#btnCheckout").addEventListener("click", () => { checkoutCustomerCart(); refreshCustomerPayment(); });
    getElement("#adminAddToCartButton").addEventListener("click", () => { productWalkinCart(); refreshAdminPayment(); });
    getElement("#adminConfirmWalkInOrderButton").addEventListener("click", () => { checkoutWalkinCart(); refreshAdminPayment(); });

}

init();
