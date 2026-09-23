import { cupDetails, toppingsDetails } from "./menu.js";
import { getElement, getToppingById, isSameCategory } from "./helper.js";
import { 
    getSelectedCup, 
    setToppingButtonsDisabled, 
    clearToppingQuantities, 
    customerToppingQueue, 
    walkinToppingQueue, 
    enqueueTopping, 
    dequeueTopping, 
    clearToppingQueue 
} from "./addToCart.js";

// Step 1: Ilagay ang lahat ng cup choices sa dropdown
// Time Complexity: O(n) - kung saan n ay bilang ng cups sa menu.
// Space Complexity: O(n) - gumagawa ng HTML string para sa mga options.
export function displayCups(selectId = "#cupSizeContainer"){
    const cupSizeContainer = getElement(selectId);
    if(!cupSizeContainer) return;
    cupSizeContainer.innerHTML = "";

    if(cupDetails.length === 0){
        cupSizeContainer.innerHTML = `<option>No Cups Available</option>`;
        return;
    }

    for(let i = 0; i < cupDetails.length; i++){
        const cup = cupDetails[i];
        cupSizeContainer.innerHTML += `<option value="${cup.cupId}">
            ${cup.cupName} - ${cup.includedToppings} Topping(s) - Php ${cup.basePrice}
        </option>`;
    }
};

// Gumagawa ng isang Plain Froyo radio button
// Time Complexity: O(1) - constant time direct HTML string creation.
// Auxiliary Space Complexity: O(1)
export function displayPlainToppings(topping, containerId = "#plainToppingsContainer", groupName = "plain"){
    const container = getElement(containerId);
    if(!container) return;

    container.innerHTML += `<label class="toppingsCheckbox">
        <input type="radio" name="${groupName}" class="plainTopping" data-was-checked="false" value="${topping.toppingId}">
        <span class="plainToppingText">${topping.toppingName} only</span>
        <span class="toppingPrice">+ PHP <span class="plainToppingPrice">0</span></span>
    </label><br>`;
};

// Step 2: Kunin sa toppingsDetails lahat ng category na "plain", then i-render
// Time Complexity: O(n) - kung saan "n" ay bilang ng toppings sa menu.
// Auxiliary Space Complexity: O(1)
// Output/DOM Space: O(n) worst-case
export function displayPlainToppingsList(containerId = "#plainToppingsContainer", groupName = "plain"){
    const plainToppingsContainer = getElement(containerId);
    if(!plainToppingsContainer) return;
    plainToppingsContainer.innerHTML = "";

    for(let i = 0; i < toppingsDetails.length; i++){
        const topping = toppingsDetails[i];
        if(topping.isAvailable && isSameCategory(topping.category, "plain")){
            displayPlainToppings(topping, containerId, groupName);
        }
    }
};




// Tinutukoy kung saang container ilalagay ang topping base sa category.
// Time Complexity: O(1) - direct string category checks.
// Space Complexity: O(1) - constant memory.
export function getContainerByCategory(category, saucesId, fruitsId, crunchsId){
    if(isSameCategory(category, "Sauce")){
        return getElement(saucesId);
    }
    if(isSameCategory(category, "Fruit")){
        return getElement(fruitsId);
    }
    if(isSameCategory(category, "Crunch")){
        return getElement(crunchsId);
    }
    return null;
}

// Gumagawa ng isang topping card na may minus button, quantity, at plus button.
// Time Complexity: O(1) - constant time single card HTML string creation.
// Space Complexity: O(1) - constant memory.
export function displayToppingProduct(topping, container){
    container.innerHTML += `<div class="products" data-topping-id="${topping.toppingId}">
        <div class="toppingInfo">
            <span class="toppingName">${topping.toppingName}</span>
            <span class="toppingMeta">${topping.category}</span>
        </div>
        <span class="toppingPrice">+ Php ${topping.extraPrice}</span>
        <div class="quantityControls">
            <button class="reduceToppingsQuantity quantityButton" type="button">-</button>
            <span class="quantity">0</span>
            <button class="addToppingsQuantity quantityButton" type="button">+</button>
        </div>
    </div>`;
};

// Step 3: I-render lahat ng non-plain toppings.
// Time Complexity: O(n) - kung saan n ay bilang ng toppings sa menu.
// Auxiliary Space Complexity: O(1)
// Output/DOM Space: O(n) worst-case
export function displayToppings(saucesId = "#saucesToppingsContainer", fruitsId = "#fruitsToppingsContainer", crunchsId = "#crunchsToppingsContainer"){
    const saucesContainer = getElement(saucesId);
    const fruitsContainer = getElement(fruitsId);
    const crunchsContainer = getElement(crunchsId);

    if(!saucesContainer || !fruitsContainer || !crunchsContainer) return;

    saucesContainer.innerHTML = "";
    fruitsContainer.innerHTML = "";
    crunchsContainer.innerHTML = "";

    if(toppingsDetails.length === 0){
        saucesContainer.innerHTML = "<p>No Toppings Available</p>";
        return;
    }

    for(let i = 0; i < toppingsDetails.length; i++){
        const topping = toppingsDetails[i];
        if(topping.isAvailable && !isSameCategory(topping.category, "plain")){
            const container = getContainerByCategory(topping.category, saucesId, fruitsId, crunchsId);
            if(container){
                displayToppingProduct(topping, container);
            }
        }
    }
};




// Ina-update ang displayed Plain Froyo price depende sa selected cup type.
// Time Complexity: O(n^2) - nested loop sa mga radio elements at linear search sa toppings.
// Space Complexity: O(1) - constant memory.
export function updatePlainToppingPrice(selectId = "#cupSizeContainer", scopeSelector = "#buildOrderSection"){
    const selectedCup = getSelectedCup(selectId);
    const scope = getElement(scopeSelector);
    if(!scope || !selectedCup) return;

    const radios = scope.querySelectorAll(".plainTopping");
    for(let radio of radios){
        
        const topping = getToppingById(radio.value);
        const priceText = radio.parentElement.querySelector(".plainToppingPrice");

        if(topping && topping.priceList && priceText){
            priceText.innerHTML = topping.priceList[selectedCup.cupType];
        }
    }
};




// Ina-update ang reminder text sa HTML base sa piniling cup.
// Time Complexity: O(n) - direct property lookup at string update.
// Space Complexity: O(1) - constant memory.
export function updateToppingReminder(selectId = "#cupSizeContainer", reminderId = "#toppingReminder"){
    const selectedCup = getSelectedCup(selectId);
    const reminderText = getElement(reminderId);

    if(!selectedCup || !reminderText) return;

    reminderText.innerHTML =
        "Included: <b>" + selectedCup.includedToppings + " topping(s) free</b> &nbsp;|&nbsp; " +
        "Max toppings: <b>" + selectedCup.maximumToppingQuantity + " units</b>";
};


// Sinusum ang kabuuang bilang ng lahat ng napiling toppings sa current section
// Time Complexity: O(n) - linear traversal sa lahat ng quantity elements sa loob ng order section.
// Space Complexity: O(1) - constant memory para sa accumulator.
export function getTotalToppingQuantity(scopeSelector = "#buildOrderSection"){
    const scope = getElement(scopeSelector);
    if(!scope) return 0;
    const quantities = scope.querySelectorAll(".quantity");
    let total = 0;
    for(let i = 0; i < quantities.length; i++){
        total += Number(quantities[i].innerHTML);
    }
    return total;
};



// Listener para sa pagpalit ng cup size sa dropdown.
// Time Complexity: O(1) - event listener setup only.
// Space Complexity: O(1) - constant memory.
export function setupCupSizeChangeListener(selectId = "#cupSizeContainer", reminderId = "#toppingReminder", scopeSelector = "#buildOrderSection", queue = customerToppingQueue){
    const cupSizeContainer = getElement(selectId);
    if(!cupSizeContainer) return;

    updatePlainToppingPrice(selectId, scopeSelector);
    updateToppingReminder(selectId, reminderId);

    cupSizeContainer.addEventListener("change", ()=>{
        updatePlainToppingPrice(selectId, scopeSelector);
        updateToppingReminder(selectId, reminderId);

        // Kung lumagpas yung current total toppings sa maximum limit ng bagong cup size, i-rereset ang toppings at queue
        const selectedCup = getSelectedCup(selectId);
        if(selectedCup && queue.length > selectedCup.maximumToppingQuantity){
            clearToppingQuantities(scopeSelector);
            clearToppingQueue(queue);
        }
    });
};




// Bawat topping row nilalagyan ng plus/minus quantity behavior na sumusunod sa kabuuang maximum limit ng cup at nag-e-enqueue/dequeue sa selection queue.
// Time Complexity: O(n) - linear loop sa products para magkabit ng click listeners
// Space Complexity: O(1) - constant memory.
export function toppingsQuantity(scopeSelector = "#buildOrderSection", selectId = "#cupSizeContainer", queue = customerToppingQueue){

    const scope = getElement(scopeSelector);
    if(!scope) return;

    const products = scope.querySelectorAll(".products");

    for(let i = 0; i < products.length; i++){
        const product = products[i];
        const toppingId = product.dataset.toppingId;
        const reduceButton = product.querySelector(".reduceToppingsQuantity");
        const quantityText = product.querySelector(".quantity");
        const addButton = product.querySelector(".addToppingsQuantity");

        reduceButton.addEventListener("click", ()=>{
            let quantity = Number(quantityText.innerHTML);
            if(quantity > 0){
                quantity--;
                quantityText.innerHTML = quantity;
                dequeueTopping(queue, toppingId);
            }
        });

        addButton.addEventListener("click", ()=>{
            let quantity = Number(quantityText.innerHTML);
            const selectedCup = getSelectedCup(selectId);
            const totalToppings = queue.length;

            // Tinitiyak na ang KABUUANG dami ng lahat ng toppings ay hindi lalagpas sa maximum limit ng cup
            if(selectedCup && totalToppings < selectedCup.maximumToppingQuantity){
                quantity++;
                quantityText.innerHTML = quantity;
                enqueueTopping(queue, toppingId);
            }
        });
    }
};

// Quantity controls ng buong cup order.
// Time Complexity: O(1) - constant time click listener setup.
// Space Complexity: O(1) - constant memory.
export function productQuantity(reduceBtnSelector = ".reduceOrderQuantity", addBtnSelector = ".addOrderQuantity", qtySelector = "#quantityProduct"){
    const reduceOrder = getElement(reduceBtnSelector);
    const quantityText = getElement(qtySelector);
    const addOrder = getElement(addBtnSelector);

    if(!reduceOrder || !quantityText || !addOrder) return;

    reduceOrder.addEventListener("click", ()=>{
        let quantity = Number(quantityText.innerHTML);
        if(quantity > 1){
            quantity--;
        }
        quantityText.innerHTML = quantity;
    });

    addOrder.addEventListener("click", ()=>{
        let quantity = Number(quantityText.innerHTML);
        quantity++;
        quantityText.innerHTML = quantity;
    });
};

// Ginagawang toggleable yung radio button ng Plain Froyo.
// Time Complexity: O(n) - linear loop sa radio buttons.
// Space Complexity: O(1) - constant memory.
export function plainFroyoClickListener(scopeSelector = "#buildOrderSection", queue = customerToppingQueue){

    const scope = getElement(scopeSelector);
    if(!scope) return;
    const radios = scope.querySelectorAll(".plainTopping");

    for(let i = 0; i < radios.length; i++){
        const radio = radios[i];
        radio.addEventListener("click", ()=>{
            if(radio.dataset.wasChecked === "false"){
                for(let j = 0; j < radios.length; j++){
                    radios[j].checked = false;
                    radios[j].dataset.wasChecked = "false";
                }

                radio.checked = true;
                radio.dataset.wasChecked = "true";
                clearToppingQueue(queue);
            }else{
                radio.checked = false;
                radio.dataset.wasChecked = "false";
            }

            setToppingButtonsDisabled(radio.checked, scopeSelector);
        });
    }
};

// Initializer for Customer Order View
export function initCustomerOrderView(){
    displayCups("#cupSizeContainer");
    displayPlainToppingsList("#plainToppingsContainer", "customerPlain");
    displayToppings("#saucesToppingsContainer", "#fruitsToppingsContainer", "#crunchsToppingsContainer");
    setupCupSizeChangeListener("#cupSizeContainer", "#toppingReminder", "#buildOrderSection", customerToppingQueue);
    toppingsQuantity("#buildOrderSection", "#cupSizeContainer", customerToppingQueue);
    productQuantity(".reduceOrderQuantity", ".addOrderQuantity", "#quantityProduct");
    plainFroyoClickListener("#buildOrderSection", customerToppingQueue);
};

// Initializer for Admin Walk-in Order View
export function initAdminOrderView(){
    displayCups("#adminCupSelect");
    displayPlainToppingsList("#adminPlainToppingsContainer", "adminPlain");
    displayToppings("#adminSaucesContainer", "#adminFruitsContainer", "#adminCrunchsContainer");
    setupCupSizeChangeListener("#adminCupSelect", "#adminToppingReminder", "#adminOrderTab", walkinToppingQueue);
    toppingsQuantity("#adminOrderTab", "#adminCupSelect", walkinToppingQueue);
    productQuantity("#adminDecreaseQuantityButton", "#adminIncreaseQuantityButton", "#adminQuantityValue");
    plainFroyoClickListener("#adminOrderTab", walkinToppingQueue);
};

// General function that export all of function to initialize those logics
// It is use when the page loaded 
export function initOrderView(){
    initCustomerOrderView();
    initAdminOrderView();
};