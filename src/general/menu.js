const baseCupDetails = [
    {
        cupId: "CUP-001",
        cupName: "Mini",
        cupType: "Paper Cup",
        includedToppings: 1,
        maximumToppingQuantity: 4,
        basePrice: 38,
        isAvailable: true
    },
    {
        cupId: "CUP-002",
        cupName: "Demi",
        cupType: "Paper Cup",
        includedToppings: 2,
        maximumToppingQuantity: 6,
        basePrice: 98,
        isAvailable: true
    },
    {
        cupId: "CUP-003",
        cupName: "Triple",
        cupType: "Paper Cup",
        includedToppings: 3,
        maximumToppingQuantity: 8,
        basePrice: 128,
        isAvailable: true
    },
    {
        cupId: "CUP-004",
        cupName: "Short",
        cupType: "Plastic Cup",
        includedToppings: 4,
        maximumToppingQuantity: 8,
        basePrice: 138,
        isAvailable: true
    },
    {
        cupId: "CUP-005",
        cupName: "Tall",
        cupType: "Plastic Cup",
        includedToppings: 5,
        maximumToppingQuantity: 10,
        basePrice: 168,
        isAvailable: true
    },
    {
        cupId: "CUP-006",
        cupName: "Grande",
        cupType: "Plastic Cup",
        includedToppings: 6,
        maximumToppingQuantity: 10,
        basePrice: 198,
        isAvailable: true
    }
];

const baseToppingsDetails = [
    {
        toppingId: "TOP-001",
        toppingName: "Strawberry",
        category: "Fruit",
        extraPrice: 25,
        isPremium: false,
        premiumPrice: 0,
        isAvailable: true
    },
    {
        toppingId: "TOP-002",
        toppingName: "Mango",
        category: "Fruit",
        extraPrice: 30,
        isPremium: false,
        premiumPrice: 0,
        isAvailable: true
    },
    {
        toppingId: "TOP-003",
        toppingName: "Kiwi",
        category: "Fruit",
        extraPrice: 25,
        isPremium: false,
        premiumPrice: 0,
        isAvailable: true
    },
    {
        toppingId: "TOP-004",
        toppingName: "Crushed Oreo",
        category: "Crunch",
        extraPrice: 20,
        isPremium: false,
        premiumPrice: 0,
        isAvailable: true
    },
    {
        toppingId: "TOP-005",
        toppingName: "Cornflakes",
        category: "Crunch",
        extraPrice: 15,
        isPremium: false,
        premiumPrice: 0,
        isAvailable: true
    },
    {
        toppingId: "TOP-006",
        toppingName: "Chocolate Sauce",
        category: "Sauce",
        extraPrice: 15,
        isPremium: false,
        premiumPrice: 0,
        isAvailable: true
    },
    {
        toppingId: "TOP-007",
        toppingName: "Caramel Sauce",
        category: "Sauce",
        extraPrice: 15,
        isPremium: false,
        premiumPrice: 0,
        isAvailable: true
    },
    {
        toppingId: "TOP-008",
        toppingName: "Biscoff Sauce",
        category: "Sauce",
        extraPrice: 20,
        isPremium: true,
        premiumPrice: 10,
        isAvailable: true
    },
    {
        toppingId: "TOP-009",
        toppingName: "Pistachio Sauce",
        category: "Sauce",
        extraPrice: 20,
        isPremium: true,
        premiumPrice: 20,
        isAvailable: true
    },
    {
        toppingId: "TOP-010",
        toppingName: "Plain Froyo",
        category: "plain",
        priceList: {
            "Paper Cup": 10,
            "Plastic Cup": 20
        },
        isAvailable: true
    },
    {
        toppingId: "TOP-011",
        toppingName: "Plain Froyo with ice Cream",
        category: "plain",
        priceList: {
            "Paper Cup": 20,
            "Plastic Cup": 30
        },
        isAvailable: true
    }
];

// Main menu container. Bawat branch ay may sariling arrays at objects para
// puwedeng baguhin ang presyo at availability nang hindi naaapektuhan ang kabila.
function createBranchMenu(){
    const cups = [];
    const toppings = [];
    for(let i = 0; i < baseCupDetails.length; i++){
        cups[cups.length] = { ...baseCupDetails[i] };
    }
    for(let i = 0; i < baseToppingsDetails.length; i++){
        const topping = baseToppingsDetails[i];
        const copy = { ...topping };
        if(topping.priceList) copy.priceList = { ...topping.priceList };
        toppings[toppings.length] = copy;
    }
    return { cupDetails: cups, toppingsDetails: toppings };
}

export const menuDetails = {
    Malolos: createBranchMenu(),
    Pulilan: createBranchMenu()
};

export function getBranchMenu(branch){
    return menuDetails[branch] || null;
}

export function isCartItemAvailable(branch, item){
    const menu = getBranchMenu(branch);
    if(!menu) return false;
    let cupAvailable = false;
    for(let i = 0; i < menu.cupDetails.length; i++){
        const cup = menu.cupDetails[i];
        if(cup.cupId === item.cupDetails.cupId && cup.isAvailable){
            cupAvailable = true;
            break;
        }
    }
    if(!cupAvailable) return false;

    if(item.plainToppingId && !hasAvailableTopping(menu.toppingsDetails, item.plainToppingId)) return false;
    for(let i = 0; i < item.selectedToppings.length; i++){
        if(!hasAvailableTopping(menu.toppingsDetails, item.selectedToppings[i].toppingId)) return false;
    }
    return true;
}

function hasAvailableTopping(toppings, toppingId){
    for(let i = 0; i < toppings.length; i++){
        if(toppings[i].toppingId === toppingId && toppings[i].isAvailable) return true;
    }
    return false;
}
