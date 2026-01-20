/**
 * Negotiator - Evaluate Script
 * Logic extracted from `Negotiator.js`
 */

class NegotiationLogic {
    constructor() {
        this.MARGIN_FLOOR = 0.7; // Never sell below 70% of list price
        this.DISCOUNT_STEP = 0.05; // 5% drops
    }

    evaluate(listPrice, offerPrice, round = 1) {
        const floorPrice = listPrice * this.MARGIN_FLOOR;

        console.log(`[Negotiator] Evaluating: Offer ${offerPrice} vs Floor ${floorPrice} (List: ${listPrice})`);

        // 1. Accept
        if (offerPrice >= listPrice * 0.95) {
            return { action: 'ACCEPT', price: offerPrice, message: "Deal. C'est un plaisir de faire affaire." };
        }

        // 2. Reject Hard (Below Floor)
        if (offerPrice < floorPrice) {
            return {
                action: 'REJECT',
                price: listPrice,
                message: "Impossible. Ce prix est en dessous de nos coûts opérationnels L5."
            };
        }

        // 3. Counter-Offer (The Dance)
        const discount = this.DISCOUNT_STEP / round;
        const counterPrice = listPrice * (1 - discount);

        return {
            action: 'COUNTER',
            price: counterPrice.toFixed(2),
            message: `Je peux faire un geste à ${counterPrice.toFixed(2)}. C'est mon offre pour valider aujourd'hui.`
        };
    }
}

// CLI Wrapper
const args = process.argv.slice(2);
const priceArg = args.find(a => a.startsWith('--price='));
const offerArg = args.find(a => a.startsWith('--offer='));
const roundArg = args.find(a => a.startsWith('--round='));

if (!priceArg || !offerArg) {
    console.error("Usage: node evaluate.js --price=100 --offer=80 [--round=1]");
    process.exit(1);
}

const listPrice = parseFloat(priceArg.split('=')[1]);
const offerPrice = parseFloat(offerArg.split('=')[1]);
const round = roundArg ? parseInt(roundArg.split('=')[1]) : 1;

const negotiator = new NegotiationLogic();
const result = negotiator.evaluate(listPrice, offerPrice, round);

console.log(JSON.stringify(result, null, 2));
