import { cupDetails, toppingsDetails } from "./menu.js";

// Reusable shortcut para hindi paulit-ulit ang document.querySelector
// Time Complexity: O(1)
// Space Complexity: O(1)
export function getElement(selector){
    return document.querySelector(selector);
}

// Linear search: hinahanap ang cup object gamit ang cupId galing sa dropdown o cart.
// Time Complexity: O(n) - kung saan n ay bilang ng cups sa menu. worst case, iikutin lahat ng items.
// Space Complexity: O(1) - auxiliary space; pointer at comparison lamang ang ginagamit. Then return value if condition meet.
export function getCupById(cupId){
    for(let cup of cupDetails){
        if(cup.cupId === cupId){
            return cup;
        }
    }
    return null;
}

// Linear search: hinahanap ang topping object gamit ang toppingId galing sa DOM.
// Time Complexity: O(n) - kung saan n ay bilang ng toppings sa menu (linear traversal).
// Space Complexity: O(1) - auxiliary space; walang karagdagang memory structures na ginagawa.
export function getToppingById(toppingId){
    for(let i = 0; i < toppingsDetails.length; i++){
        if(toppingsDetails[i].toppingId === toppingId){
            return toppingsDetails[i];
        }
    }
    return null;
}

// Small helper para hindi case-sensitive ang category comparison.
// Time Complexity: O(1) - constant time string comparison only
// Space Complexity: O(1) - constant memory para sa lowercase strings.
export function isSameCategory(value, target){
    return value.toLowerCase() === target.toLowerCase();
}

// Ginagawang readable text ang toppings sa cart o order summary (e.g. "Strawberry, Mango (2)").
// Kapag qty >= 2, idinagdag ang "(qty)" sa dulo ng topping name.
// Kapag qty === 1, topping name lang ang nakalagay — walang suffix.
// Time Complexity: O(n) - kung saan n ay bilang ng selected toppings na i-iterate.
// Space Complexity: O(n) - string concatenation na naglalaan ng bagong string na may habang proportional sa bilang at pangalan ng toppings.
export function formatToppings(selectedToppings){
    let text = "";

    if(!selectedToppings || selectedToppings.length === 0){
        return "None";
    }

    for(let i = 0; i < selectedToppings.length; i++){
        const topping = selectedToppings[i];

        if(topping.quantity >= 2){
            text += topping.toppingName + " (" + topping.quantity + ")";
        } else {
            text += topping.toppingName;
        }

        if(i < selectedToppings.length - 1){
            text += ", ";
        }
    }

    return text;
}

// Gumagawa ng HTML table ng order summary. Ginagamit pareho sa checkout at order status.
// Time Complexity: O(n^2) - nested loop sa pag-ikot sa bawat item at pag-format sa mga toppings nito.
// Space Complexity: O(n) - lumilikha ng HTML string na proporsyonal sa dami ng mga item at toppings.
export function buildOrderSummaryHTML(order){
    let html = "<table class=\"orderSummaryTable\">";
    html += `<tr>
                <th>Cup</th>
                <th>Qty</th>
                <th>Toppings</th>
                <th>Add-ons</th>
                <th>Line Total</th>
             </tr>`;

    for(let i = 0; i < order.orderedItems.length; i++){
        const item = order.orderedItems[i];
        const addOnTotal = item.extraToppingTotal + item.premiumToppingTotal + item.plainFroyoAddOn;

        html += "<tr>";
        html += "<td>" + item.cupDetails.cupName + "</td>";
        html += "<td>" + item.quantity + "</td>";
        html += "<td>" + formatToppings(item.selectedToppings) + "</td>";
        html += "<td>Php " + addOnTotal + "</td>";
        html += "<td>Php " + item.lineTotal + "</td>";
        html += "</tr>";
    }

    html += "</table>";
    html += "<p class=\"orderTotal\"><b>Order Total: Php " + order.orderTotal + "</b></p>";
    return html;
}
