import { initOrderView } from "./src/general/orderView.js";
import { productCustomerCart, productWalkinCart, renderCustomerCart, renderWalkinCart } from "./src/general/addToCart.js";
import { checkoutCustomerCart } from "./src/customer/customerCheckOutOrder.js";
import { checkoutWalkinCart } from "./src/cashier/walkinCheckOutOrder.js";
import { renderOrderStatus } from "./src/customer/orderStatus.js";
import { initOrderQueue, renderOrderQueue } from "./src/cashier/orderQueue.js";
import { renderOrderLogs } from "./src/cashier/orderLogs.js";
import { initScanner } from "./src/cashier/scanner.js";
import { getElement } from "./src/general/helper.js";

// Switch Account Controller (Customer Portal vs Admin/Staff Portal)
// Time Complexity: O(1) - DOM display property toggles at branch execution.
// Space Complexity: O(1) - constant memory.
function switchAccount(accountType){
    const customerView = getElement("#customerView");
    const adminView = getElement("#adminView");

    if(!customerView || !adminView) return;

    if(accountType === "Admin"){
        customerView.style.display = "none";
        adminView.style.display = "block";
        switchAdminTab("Walkin");
    } else {
        customerView.style.display = "block";
        adminView.style.display = "none";
        switchCustomerTab("Order");
    }
}

// Customer Tab Switcher (Create Order vs Order Status)
// Time Complexity: O(1) kapag "Order" tab; O(n^2) kapag "Status" tab dahil sa renderOrderStatus().
// Space Complexity: O(1) para sa "Order" tab; O(n) para sa "Status" tab dahil sa dynamic status table HTML generation.
function switchCustomerTab(tabName){
    const orderTab = getElement("#customerOrderTab");
    const statusSection = getElement("#orderStatusSection");

    if(!orderTab || !statusSection) return;

    if(tabName === "Order"){
        orderTab.style.display = "block";
        statusSection.style.display = "none";
    } else if(tabName === "Status"){
        orderTab.style.display = "none";
        statusSection.style.display = "block";
        renderOrderStatus();
        statusSection.scrollIntoView({ behavior: "smooth" });
    }
}

// Admin Tab Switcher (Walk-in Order vs Scanner vs Order Queue vs Order Logs)
// Time Complexity: O(1) kapag "Walkin" o "Scanner"; O(n^2) kapag "Queue" o "Logs" tab dahil sa render functions.
// Space Complexity: O(1) para sa "Walkin"/"Scanner"; O(n) para sa "Queue"/"Logs" tab para sa table HTML string.
function switchAdminTab(tabName){
    const walkinTab = getElement("#adminOrderTab");
    const scannerTab = getElement("#adminScannerTab");
    const queueTab = getElement("#adminQueueTab");
    const logsTab = getElement("#adminLogsTab");

    if(!walkinTab || !scannerTab || !queueTab || !logsTab) return;

    walkinTab.style.display = tabName === "Walkin" ? "block" : "none";
    scannerTab.style.display = tabName === "Scanner" ? "block" : "none";
    queueTab.style.display = tabName === "Queue" ? "block" : "none";
    logsTab.style.display = tabName === "Logs" ? "block" : "none";

    if(tabName === "Queue"){
        renderOrderQueue();
    }
    if(tabName === "Logs"){
        renderOrderLogs();
    }
}

// Main initialization function
// Time Complexity: O(n) - kung saan n ay bilang ng items sa menu (cups at toppings) para sa initial rendering.
// Space Complexity: O(n) - memory para sa initial DOM nodes ng mga cup at topping controls.
function init(){
    // 1. I-render ang UI at form controls para sa Customer at Admin Walk-in
    initOrderView();

    // 2. I-render ang initial empty carts
    renderCustomerCart();
    renderWalkinCart();

    // 3. I-initialize ang QR Scanner at Order Queue systems
    initScanner();
    initOrderQueue();

    // 4. Switch Account buttons
    const btnToAdmin = getElement("#switchToAdminButton");
    const btnToCustomer = getElement("#switchToCustomerButton");
    if(btnToAdmin) btnToAdmin.addEventListener("click", () => switchAccount("Admin"));
    if(btnToCustomer) btnToCustomer.addEventListener("click", () => switchAccount("Customer"));

    // 5. Customer Tab buttons
    const btnCreateOrder = getElement("#btnCreateOrder");
    const btnOrderStatus = getElement("#btnOrderStatus");
    if(btnCreateOrder) btnCreateOrder.addEventListener("click", () => switchCustomerTab("Order"));
    if(btnOrderStatus) btnOrderStatus.addEventListener("click", () => switchCustomerTab("Status"));

    // 6. Admin Tab buttons
    const btnWalkin = getElement("#btnAdminWalkInOrder");
    const btnScanner = getElement("#btnAdminScanner");
    const btnQueue = getElement("#btnAdminQueue");
    const btnLogs = getElement("#btnAdminLogs");
    if(btnWalkin) btnWalkin.addEventListener("click", () => switchAdminTab("Walkin"));
    if(btnScanner) btnScanner.addEventListener("click", () => switchAdminTab("Scanner"));
    if(btnQueue) btnQueue.addEventListener("click", () => switchAdminTab("Queue"));
    if(btnLogs) btnLogs.addEventListener("click", () => switchAdminTab("Logs"));

    // 7. Customer actions: Add to Cart at Checkout
    const btnAddToCart = getElement("#btnAddToCart");
    const btnCheckout = getElement("#btnCheckout");
    if(btnAddToCart) btnAddToCart.addEventListener("click", productCustomerCart);
    if(btnCheckout) btnCheckout.addEventListener("click", checkoutCustomerCart);

    // 8. Admin Walk-in actions: Add to Cart at Confirm Walk-in Order
    const btnAdminAddToCart = getElement("#adminAddToCartButton");
    const btnAdminConfirm = getElement("#adminConfirmWalkInOrderButton");
    if(btnAdminAddToCart) btnAdminAddToCart.addEventListener("click", productWalkinCart);
    if(btnAdminConfirm) btnAdminConfirm.addEventListener("click", checkoutWalkinCart);
}

init();
