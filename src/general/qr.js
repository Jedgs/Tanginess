// qr.js — Hiwalay na file para sa lahat ng QR code generation logic.
// Ini-import ito sa script.js para hindi masyadong mahaba ang main file.
// Gumagamit ng qrcode.js library na ini-load sa index.html via CDN.

// Gumagawa ng QR code sa loob ng isang container element.
// Ikinakapit ang qrValue bilang text ng QR (e.g. "QR-1001-1").
// Ini-clear muna ang container bago gumawa ng bago para hindi mag-stack.
// Time Complexity: O(1) - fixed resolution (180x180 px) at constant time execution sa pag-render ng QR image.
// Space Complexity: O(1) - constant memory para sa fixed-size canvas/image element sa loob ng DOM.
export function generateQRCode(container, qrValue){
    container.innerHTML = "";

    // Tinitiyak na naka-load ang QRCode library bago gamitin.
    if(typeof QRCode === "undefined"){
        container.innerHTML = "<p>QR library not loaded.</p>";
        return;
    }

    new QRCode(container, {
        text: qrValue,
        width: 180,
        height: 180,
        correctLevel: QRCode.CorrectLevel.L
    });
}
