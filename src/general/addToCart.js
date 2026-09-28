import { getElement, getMenuBranch, getCupById, getToppingById, formatToppings, escapeHTML } from "./helper.js";
import { removeItemAt } from "./arrayOps.js";

// Stores para sa magkahiwalay na customer cart at walk-in cart
export const customerCartDetails = [];
export const walkinCartDetails = [];

// Selection Queues para sa pagkakasunod-sunod ng pagpili ng toppings (FIFO - First-In, First-Out)
export const customerToppingQueue = [];
export const walkinToppingQueue = [];

// Nagdadagdag ng toppingId sa dulo ng selection queue (DSA Enqueue).
// Time Complexity: O(1) - direct index assignment sa dulo ng array.
// Space Complexity: O(1) - constant memory.
export function enqueueTopping(queue, toppingId){
    queue[queue.length] = toppingId;
}

// Nagtatanggal ng pinakabagong instance ng toppingId mula sa selection queue (DSA manual shift).
// Time Complexity: O(n) - linear search mula sa dulo at manual shift ng remaining elements.
// Space Complexity: O(1) - in-place modification nang walang builtin methods.
export function dequeueTopping(queue, toppingId){
    let targetIndex = -1;
    for(let i = queue.length - 1; i >= 0; i--){
        if(queue[i] === toppingId){
            targetIndex = i;
            break;
        }
    }
    if(targetIndex !== -1){
        for(let j = targetIndex; j < queue.length - 1; j++){
            queue[j] = queue[j + 1];
        }
        queue.length = queue.length - 1;
    }
}

// Nililinis ang lahat ng elements sa loob ng selection queue
// Time Complexity: O(n) - manual loop length reduction pabalik sa zero.
// Space Complexity: O(1) - in-place array modification.
export function clearToppingQueue(queue){
    for(let i = queue.length - 1; i >= 0; i--){
        queue.length = queue.length - 1;
    }
}

let lastCustomerCartId = 1;
let lastWalkinCartId = 1;

// Unique CartId Generator
// Time Complexity: O(1)
// Space Complexity: O(1)
export function generateCartId(prefix, counter){
    let idNum = String(counter);
    while(idNum.length < 4){
        idNum = "0" + idNum;
    }
    return `${prefix}-${idNum}`;
}

// Getting the selected cup on select dropdown
// Time Complexity: O(n)
// Space Complexity: O(1)
export function getSelectedCup(selectId = "#cupSizeContainer"){
    const cupContainer = getElement(selectId);
    if(!cupContainer) return null;
    return getCupById(cupContainer.value, getMenuBranch(selectId));
}


// Checking if it has selected plain category
// Time Complexity: O(n)
// Space Complexity: O(1)
export function getSelectedPlainTopping(selector = ".plainTopping"){
    const radios = document.querySelectorAll(selector);
    for(let radio of radios){
        if(radio.checked){
            return getToppingById(radio.value, getMenuBranch(selector));
        }
    }
    return null;
}


// Kinukuha ang plain add-on price base sa cup type (Paper Cup vs Plastic Cup).
// Time Complexity: O(1) - direct dictionary / property lookup sa priceList.
// Space Complexity: O(1) - nagbabalik ng number primitive.
export function getPlainToppingPrice(topping, selectedCup){
    if(topping && topping.priceList && selectedCup && topping.priceList[selectedCup.cupType] !== undefined){
        return topping.priceList[selectedCup.cupType];
    }
    return 0;
}

// Binibilang kung ilan sa quantity ng isang topping ang kasali sa libreng included slots,
// at ilan ang extra (bayad) base sa nagastos nang usedIncluded slots.
// Time Complexity: O(n) - linear loop base sa bilang ng quantity units ng topping.
// Space Complexity: O(1) - nagbabalik ng maliit na object na may dalawang integers { included, extra }.
export function computeIncludedAndExtra(quantity, includedCount, usedIncluded){
    let included = 0;
    let extra = 0;

    for(let count = 0; count < quantity; count++){
        if(usedIncluded + included < includedCount){
            included++;
        } else {
            extra++;
        }
    }

    return { included: included, extra: extra };
}


// Kinokolekta lahat ng napiling toppings base sa FIFO Queue order ng pagkakapili.
// Ang mga unang items sa queue hanggang sa includedToppings limit ay magiging included (libreng topping),
// at ang mga sumunod na items sa queue ay magiging extra (may additional charge).
// Time Complexity: O(n^2) - pag-ikot sa queue at grouping ng unique toppings.
// Space Complexity: O(n) - lumilikha ng array na nag-iimbak ng mga napiling toppings.
export function getSelectedToppings(productsSelector = ".products", selectedCup = null, queue = null){
    const selectedToppings = [];
    const branch = getMenuBranch(productsSelector);

    // Kung may ibinigay na queue, gamitin yung FIFO order nito para sa included vs extra
    if(queue && queue.length > 0){
        const includedLimit = selectedCup ? selectedCup.includedToppings : 0;

        for(let i = 0; i < queue.length; i++){
            const toppingId = queue[i];
            const isIncludedUnit = i < includedLimit;

            // Hanapin kung nasa selectedToppings na itong toppingId (DSA linear search)
            let existingItem = null;
            for(let j = 0; j < selectedToppings.length; j++){
                if(selectedToppings[j].toppingId === toppingId){
                    existingItem = selectedToppings[j];
                    break;
                }
            }

            if(existingItem){
                existingItem.quantity++;
                if(isIncludedUnit){
                    existingItem.includedQuantity++;
                } else {
                    existingItem.extraQuantity++;
                }
                existingItem.isIncluded = (existingItem.extraQuantity === 0);
            } else {
                const topping = getToppingById(toppingId, branch);
                if(topping){
                    const incQty = isIncludedUnit ? 1 : 0;
                    const extQty = isIncludedUnit ? 0 : 1;

                    selectedToppings[selectedToppings.length] = {
                        toppingId: topping.toppingId,
                        toppingName: topping.toppingName,
                        category: topping.category,
                        extraPrice: topping.extraPrice,
                        isPremium: topping.isPremium,
                        premiumPrice: topping.isPremium ? topping.premiumPrice : 0,
                        quantity: 1,
                        includedQuantity: incQty,
                        extraQuantity: extQty,
                        isIncluded: (extQty === 0)
                    };
                }
            }
        }

        return selectedToppings;
    }

    const products = document.querySelectorAll(productsSelector);
    let usedIncluded = 0;

    for(let i = 0; i < products.length; i++){
        const product = products[i];
        const quantityText = product.querySelector(".quantity");
        const quantity = Number(quantityText.innerHTML);

        if(quantity > 0){
            const topping = getToppingById(product.dataset.toppingId, branch);

            if(topping){
                const includedCount = selectedCup ? selectedCup.includedToppings : 0;
                const counts = computeIncludedAndExtra(quantity, includedCount, usedIncluded);
                usedIncluded += counts.included;

                selectedToppings[selectedToppings.length] = {
                    toppingId: topping.toppingId,
                    toppingName: topping.toppingName,
                    category: topping.category,
                    extraPrice: topping.extraPrice,
                    isPremium: topping.isPremium,
                    premiumPrice: topping.isPremium ? topping.premiumPrice : 0,
                    quantity: quantity,
                    includedQuantity: counts.included,
                    extraQuantity: counts.extra,
                    isIncluded: counts.extra === 0
                };
            }
        }
    }

    return selectedToppings;
}

// Ina-add lang ang extraPrice para sa mga units na lumagpas sa included slots.
// Time Complexity: O(n) - linear loop sa array ng napiling toppings.
// Space Complexity: O(1) - single accumulator number variable.
export function getExtraToppingTotal(selectedToppings){
    let total = 0;
    for(let i = 0; i < selectedToppings.length; i++){
        total += selectedToppings[i].extraPrice * selectedToppings[i].extraQuantity;
    }
    return total;
}

// Ina-add ang premiumPrice surcharge para sa lahat ng units ng bawat premium topping.
// Time Complexity: O(n) - linear loop sa array ng napiling toppings.
// Space Complexity: O(1) - single accumulator number variable.
export function getPremiumToppingTotal(selectedToppings){
    let total = 0;
    for(let i = 0; i < selectedToppings.length; i++){
        if(selectedToppings[i].isPremium){
            total += selectedToppings[i].premiumPrice * selectedToppings[i].quantity;
        }
    }
    return total;
}

// Inirereset sa 0 ang lahat ng topping counters sa loob ng container.
// Time Complexity: O(n) - kung saan n ay bilang ng topping cards sa form.
// Space Complexity: O(1) - DOM property text updates.
export function clearToppingQuantities(scopeSelector = "#buildOrderSection"){
    const scope = getElement(scopeSelector);
    if(!scope) return;
    const quantities = scope.querySelectorAll(".quantity");
    for(let quantity of quantities){
        quantity.innerHTML = 0;
    }
}

// I-enable o i-disable ang plus/minus buttons ng toppings kapag pinili ang Plain Froyo.
// Time Complexity: O(n) - kung saan n ay bilang ng topping product rows sa screen.
// Space Complexity: O(1) - in-place DOM property adjustments.
export function setToppingButtonsDisabled(isDisabled, scopeSelector = "#buildOrderSection"){
    const scope = getElement(scopeSelector);
    if(!scope) return;
    const toppings = scope.querySelectorAll(".products");
    let setBackgroundColor = isDisabled ? "#C7D3DD" : "#049fd3";
    let setColor = isDisabled ? "#37393A" : "#ffffff";

    for(let i = 0; i < toppings.length; i++){
        const topping = toppings[i];
        const btnReduce = topping.querySelector(".reduceToppingsQuantity");
        const btnAdd = topping.querySelector(".addToppingsQuantity");
        const quantityText = topping.querySelector(".quantity");

        if(isDisabled && quantityText){
            quantityText.innerHTML = 0;
        }

        const buttons = [btnReduce, btnAdd];
        for(let b = 0; b < buttons.length; b++){
            const btn = buttons[b];
            if(btn){
                btn.disabled = isDisabled;
                btn.style.backgroundColor = setBackgroundColor;
                btn.style.color = setColor;
            }
        }
    }
}

// Tinatanggal ang check sa Plain Froyo radio button at ibinabalik ang topping buttons.
// Time Complexity: O(n) - linear loop sa radio buttons at topping cards.
// Space Complexity: O(1) - auxiliary space.
export function resetPlainTopping(scopeSelector = "#buildOrderSection", radioSelector = ".plainTopping"){
    const radios = document.querySelectorAll(radioSelector);
    for(let i = 0; i < radios.length; i++){
        radios[i].checked = false;
        radios[i].dataset.wasChecked = "false";
    }
    setToppingButtonsDisabled(false, scopeSelector);
}

// Full reset ng build form pagkatapos mag-add to cart.
// Time Complexity: O(n) - kung saan n ay kabuuang elements ng toppings at inputs.
// Space Complexity: O(1) - auxiliary memory.
export function resetOrderForm(isCustomer = true){
    const qtySelector = isCustomer ? "#quantityProduct" : "#adminQuantityValue";
    const scopeSelector = isCustomer ? "#buildOrderSection" : "#adminOrderTab";
    const radioSelector = isCustomer ? "#plainToppingsContainer .plainTopping" : "#adminPlainToppingsContainer .plainTopping";
    const targetQueue = isCustomer ? customerToppingQueue : walkinToppingQueue;

    const quantityProduct = getElement(qtySelector);
    if(quantityProduct){
        quantityProduct.innerHTML = 1;
    }
    clearToppingQuantities(scopeSelector);
    clearToppingQueue(targetQueue);
    resetPlainTopping(scopeSelector, radioSelector);
}

// Manual reset ng laman ng cart sa pamamagitan ng length decrementation.
// Time Complexity: O(n) - kung saan n ay bilang ng cart items na aalisin pabalik sa zero.
// Space Complexity: O(1) - in-place array truncation.
export function clearCartArray(cartList){
    for(let i = cartList.length - 1; i >= 0; i--){
        cartList.length = cartList.length - 1;
    }
}

// Time Complexity: O(n) - tumatawag sa clearCartArray para sa customer cart.
// Space Complexity: O(1) - in-place.
export function clearCustomerCart(){
    clearCartArray(customerCartDetails);
}

// Time Complexity: O(n) - tumatawag sa clearCartArray para sa walk-in cart.
// Space Complexity: O(1) - in-place.
export function clearWalkinCart(){
    clearCartArray(walkinCartDetails);
}

export function removeCartItem(cartList, index){
    return removeItemAt(cartList, index);
}

// Parehong cup at toppings (kasama ang dami at presyo ng add-ons) ay isang cart row lang.
function hasSameConfiguration(item, newItem){
    if(item.cupDetails.cupId !== newItem.cupDetails.cupId ||
        (item.plainToppingId || "") !== (newItem.plainToppingId || "") ||
        item.plainFroyoAddOn !== newItem.plainFroyoAddOn ||
        item.extraToppingTotal !== newItem.extraToppingTotal ||
        item.premiumToppingTotal !== newItem.premiumToppingTotal ||
        item.selectedToppings.length !== newItem.selectedToppings.length) return false;

    for(let i = 0; i < newItem.selectedToppings.length; i++){
        const topping = newItem.selectedToppings[i];
        let found = false;
        for(let j = 0; j < item.selectedToppings.length; j++){
            const existing = item.selectedToppings[j];
            if(existing.toppingId === topping.toppingId &&
                existing.quantity === topping.quantity &&
                existing.includedQuantity === topping.includedQuantity &&
                existing.extraQuantity === topping.extraQuantity){
                found = true;
                break;
            }
        }
        if(!found) return false;
    }
    return true;
}

export function addOrMergeCartItem(cartList, newItem){
    for(let i = 0; i < cartList.length; i++){
        const item = cartList[i];
        if(hasSameConfiguration(item, newItem)){
            item.quantity += newItem.quantity;
            item.lineTotal += newItem.lineTotal;
            return item;
        }
    }
    cartList[cartList.length] = newItem;
    return newItem;
}

// Reusable function sa pag-render ng cart items sa UI.
// Time Complexity: O(n^2) - nested loop sa pag-render ng cart items at mga toppings nito.
// Space Complexity: O(n) - lumilikha ng HTML string para sa DOM injection.
export function renderCartItems(cartList, containerSelector, subtotalSelector, emptySelector){
    const container = getElement(containerSelector);
    const emptyEl = getElement(emptySelector);
    const subtotalEl = getElement(subtotalSelector);
    let subtotal = 0;

    if(!container || !subtotalEl) return;

    container.innerHTML = "";

    if(cartList.length === 0){
        if(emptyEl) emptyEl.style.display = "block";
        subtotalEl.innerHTML = "0";
        return;
    }

    if(emptyEl) emptyEl.style.display = "none";

    for(let i = 0; i < cartList.length; i++){
        const item = cartList[i];
        subtotal += item.lineTotal;

        if(i > 0){
            container.innerHTML += `<hr class="cartSeparator">`;
        }

        container.innerHTML += `<div>
            <h3>${escapeHTML(item.cupDetails.cupName)} x ${item.quantity}</h3>
            <p>Toppings: <span>${formatToppings(item.selectedToppings)}</span></p>
            <p>Plain Add-On: Php ${item.plainFroyoAddOn * item.quantity}</p>
            <p>Extra Toppings: Php ${item.extraToppingTotal * item.quantity}</p>
            <p>Premium Surcharge: Php ${item.premiumToppingTotal * item.quantity}</p>
            <p><b>Line Total: Php ${item.lineTotal}</b></p>
            <button type="button" class="removeCartItem" data-remove-cart="${i}" aria-label="Remove ${escapeHTML(item.cupDetails.cupName)} from cart">Remove</button>
        </div>`;
    }

    subtotalEl.innerHTML = subtotal;
}

// Time Complexity: O(n^2) - nagre-render ng customer cart items.
// Space Complexity: O(n) - DOM innerHTML string.
export function renderCustomerCart(){
    renderCartItems(customerCartDetails, ".cartContainer", "#subtotalCheckout", "#cartEmpty");
}

// Time Complexity: O(n^2) - nagre-render ng walk-in cart items.
// Space Complexity: O(n) - DOM innerHTML string.
export function renderWalkinCart(){
    renderCartItems(walkinCartDetails, "#adminCartContainer", "#adminCartSubtotalText", "#adminCartEmpty");
}

// Reusable Add to Cart processor para sa Customer at Walk-in
// Time Complexity: O(n^2) - nested operations para sa toppings calculation at cart rendering.
// Space Complexity: O(n) - lumilikha ng bagong cart item na may array ng toppings.
export function executeAddToCart(type = "customer"){
    const isCustomer = type === "customer";
    const cupSelectId = isCustomer ? "#cupSizeContainer" : "#adminCupSelect";
    const radioSelector = isCustomer ? "#plainToppingsContainer .plainTopping" : "#adminPlainToppingsContainer .plainTopping";
    const productsSelector = isCustomer ? "#buildOrderSection .products" : "#adminOrderTab .products";
    const qtySelector = isCustomer ? "#quantityProduct" : "#adminQuantityValue";
    const targetCart = isCustomer ? customerCartDetails : walkinCartDetails;
    const prefix = isCustomer ? "CART" : "ADMIN-CART";
    const messageEl = isCustomer ? null : getElement("#adminOrderMessage");

    const selectedCup = getSelectedCup(cupSelectId);
    if(!selectedCup){
        if(messageEl) messageEl.textContent = "Select an available cup for this branch.";
        else alert("Select an available cup for this branch.");
        return;
    }
    const selectedPlainTopping = getSelectedPlainTopping(radioSelector);
    const targetQueue = isCustomer ? customerToppingQueue : walkinToppingQueue;
    const selectedToppings = selectedPlainTopping ? [] : getSelectedToppings(productsSelector, selectedCup, targetQueue);

    if(!selectedPlainTopping && selectedToppings.length === 0){
        alert("Please select at least one topping before adding to cart.");
        return;
    }

    let totalToppingUnits = 0;
    for(let i = 0; i < selectedToppings.length; i++){
        totalToppingUnits += selectedToppings[i].quantity;
    }

    if(selectedCup && totalToppingUnits > selectedCup.maximumToppingQuantity){
        alert("Total toppings (" + totalToppingUnits + ") exceeds maximum allowed (" + selectedCup.maximumToppingQuantity + ") for this cup.");
        return;
    }

    const plainFroyoAddOn = getPlainToppingPrice(selectedPlainTopping, selectedCup);
    const extraToppingTotal = getExtraToppingTotal(selectedToppings);
    const premiumToppingTotal = getPremiumToppingTotal(selectedToppings);
    const quantity = Number(getElement(qtySelector).innerHTML);
    const lineTotal = (selectedCup.basePrice + plainFroyoAddOn + extraToppingTotal + premiumToppingTotal) * quantity;

    const newItem = {
        cartItemId: generateCartId(prefix, isCustomer ? lastCustomerCartId++ : lastWalkinCartId++),
        cupDetails: {
            cupId: selectedCup.cupId,
            cupName: selectedCup.cupName,
            cupType: selectedCup.cupType,
            includedToppings: selectedCup.includedToppings,
            basePrice: selectedCup.basePrice
        },
        extraToppingTotal: extraToppingTotal,
        lineTotal: lineTotal,
        plainFroyoAddOn: plainFroyoAddOn,
        plainToppingId: selectedPlainTopping?.toppingId || "",
        premiumToppingTotal: premiumToppingTotal,
        quantity: quantity,
        selectedToppings: selectedToppings
    };
    addOrMergeCartItem(targetCart, newItem);

    if(isCustomer){
        renderCustomerCart();
    } else {
        renderWalkinCart();
        if(messageEl) messageEl.textContent = "Added to walk-in cart.";
    }

    resetOrderForm(isCustomer);
}

// Time Complexity: O(n^2) - nagpoproseso ng customer add-to-cart.
// Space Complexity: O(n) - bagong item sa customerCartDetails.
export function productCustomerCart(){
    executeAddToCart("customer");
}

// Time Complexity: O(n^2) - nagpoproseso ng walk-in add-to-cart.
// Space Complexity: O(n) - bagong item sa walkinCartDetails.
export function productWalkinCart(){
    executeAddToCart("walkin");
}
