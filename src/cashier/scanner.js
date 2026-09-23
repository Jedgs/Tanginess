import { orderDetails } from "../customer/orderStatus.js";
import { getElement, buildOrderSummaryHTML } from "../general/helper.js";
import { addQueueOrder, renderOrderQueue } from "./orderQueue.js";

let scanner = null;
let scannerRunning = false;
let currentScannedOrder = null;

// Linear search sa orderDetails para hanapin ang order gamit ang qrCodeUniqueId (DSA Linear Search).
// Time Complexity: O(n) - kung saan n ay bilang ng orders sa orderDetails; tinitingnan ang bawat order isa-isa hanggang mahanap ang QR id.
// Space Complexity: O(1) - constant space, walang nililikhang bagong memory bukod sa loop index at reference.
function findOrderByQr(qrId){
    for(let i = 0; i < orderDetails.length; i++){
        if(orderDetails[i].qrCodeUniqueId === qrId){
            return orderDetails[i];
        }
    }
    return null;
}

// Bumabasa at nagpa-parse sa na-scan na QR text mula sa camera o image file.
// Time Complexity: O(n) - linear search sa orderDetails at pagbuo ng HTML summary.
// Space Complexity: O(n) - lumilikha ng HTML summary string para sa order.
function readQrPayload(qrText){
    const statusText = getElement("#scannerStatus");
    const container = getElement("#orderDetailsContainer");
    const confirmSection = getElement("#scannerConfirmSection");
    const confirmMsg = getElement("#scannerConfirmMessage");
    const paymentSelect = getElement("#scannerPaymentMethod");

    let order = findOrderByQr(qrText);

    // Subukan kung JSON stringified ang QR payload
    if(order === null){
        try {
            const parsed = JSON.parse(qrText);
            if(parsed && parsed.qrCodeUniqueId){
                order = findOrderByQr(parsed.qrCodeUniqueId);
            }
        } catch(e){
            // Normal string QR text lang, patuloy
        }
    }

    if(order === null){
        if(statusText){
            statusText.textContent = "QR code read (" + qrText + "), but order was not found in this session.";
        }
        if(container){
            container.innerHTML = "<p>No matching order found for QR: " + qrText + "</p>";
        }
        if(confirmSection) confirmSection.style.display = "none";
        return;
    }

    currentScannedOrder = order;

    if(container){
        container.innerHTML = buildOrderSummaryHTML(currentScannedOrder);
    }
    if(statusText){
        statusText.textContent = "QR scanned successfully! Order ID: " + order.orderId;
    }

    // Ipakita ang confirm section at i-reset ang payment dropdown at message
    if(confirmSection) confirmSection.style.display = "block";
    if(paymentSelect) paymentSelect.value = "";
    if(confirmMsg) confirmMsg.textContent = "";
}

// Sinisimulan ang camera scanner gamit ang Html5Qrcode library.
// Time Complexity: O(1) - asynchronous initialization ng video feed at camera stream.
// Space Complexity: O(1) - constant memory para sa camera instance reference.
export async function startScanner(){
    const statusText = getElement("#scannerStatus");

    if(typeof Html5Qrcode === "undefined"){
        if(statusText) statusText.textContent = "Html5Qrcode library is not loaded.";
        return;
    }

    try {
        scanner = new Html5Qrcode("reader");
        await scanner.start(
            { facingMode: "environment" },
            { fps: 20, qrbox: 250 },
            function(decodedText){
                readQrPayload(decodedText);
                stopScanner();
            }
        );
        scannerRunning = true;
        if(statusText) statusText.textContent = "Camera scanner running. Point camera at customer QR code.";
    } catch(err){
        if(statusText) statusText.textContent = "Cannot access camera: " + err;
    }
}

// Itinitigil ang camera scanner.
// Time Complexity: O(1) - asynchronous video stream termination.
// Space Complexity: O(1) - constant space.
export async function stopScanner(){
    const statusText = getElement("#scannerStatus");
    if(scanner !== null && scannerRunning === true){
        try {
            await scanner.stop();
        } catch(e){}
        scannerRunning = false;
        if(statusText) statusText.textContent = "Camera scanner stopped.";
    }
}

// Bumabasa ng na-upload na picture ng QR code.
// Time Complexity: O(1) image scan file call; susundan ng readQrPayload O(n) kapag may na-detect na QR code.
// Space Complexity: O(1) - constant memory para sa image instance handler.
export async function scanQrImage(){
    const fileInput = getElement("#qrImageInput");
    const statusText = getElement("#scannerStatus");

    if(!fileInput || fileInput.files.length === 0){
        if(statusText) statusText.textContent = "Please choose a QR image file first.";
        return;
    }

    if(typeof Html5Qrcode === "undefined"){
        if(statusText) statusText.textContent = "Html5Qrcode library is not loaded.";
        return;
    }

    const imageScanner = new Html5Qrcode("reader");
    try {
        const decodedText = await imageScanner.scanFile(fileInput.files[0], true);
        readQrPayload(decodedText);
    } catch(err){
        if(statusText) statusText.textContent = "Cannot read uploaded QR image: " + err;
    }
}

// Kinokonpirma ang scanned order: nagtatakda ng payment method at idinadagdag sa Order Queue.
// Time Complexity: O(1) - direct property assignment at addQueueOrder O(1).
// Space Complexity: O(1) - walang bagong array o structure na nililikha.
function confirmScannedOrder(){
    const paymentSelect = getElement("#scannerPaymentMethod");
    const confirmMsg = getElement("#scannerConfirmMessage");
    const confirmSection = getElement("#scannerConfirmSection");

    if(currentScannedOrder === null){
        if(confirmMsg) confirmMsg.textContent = "No scanned order to confirm.";
        return;
    }

    const paymentMethod = paymentSelect ? paymentSelect.value : "";
    if(paymentMethod === ""){
        if(confirmMsg) confirmMsg.textContent = "Please select a payment method first.";
        return;
    }

    // I-set ang payment method sa order
    currentScannedOrder.paymentMethod = paymentMethod;
    currentScannedOrder.orderStatus = "Pending Preparation";

    // Ilagay sa Order Queue
    addQueueOrder(currentScannedOrder);
    renderOrderQueue();

    if(confirmMsg){
        confirmMsg.textContent = "Order " + currentScannedOrder.orderId + " confirmed and added to queue!";
    }

    // I-reset para hindi maka-double confirm
    currentScannedOrder = null;
    if(confirmSection) confirmSection.style.display = "none";
}

// Setup ng listeners para sa Scanner tab.
// Time Complexity: O(1) - pagkakabit ng apat na event listeners sa DOM buttons.
// Space Complexity: O(1) - constant memory.
export function initScanner(){
    const btnStart = getElement("#startScannerButton");
    const btnStop = getElement("#stopScannerButton");
    const btnScanImage = getElement("#scanImageButton");
    const btnConfirm = getElement("#btnConfirmScannedOrder");

    if(btnStart) btnStart.addEventListener("click", startScanner);
    if(btnStop) btnStop.addEventListener("click", stopScanner);
    if(btnScanImage) btnScanImage.addEventListener("click", scanQrImage);
    if(btnConfirm) btnConfirm.addEventListener("click", confirmScannedOrder);
}

