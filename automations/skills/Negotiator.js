/**
 * Negotiation Skill (The Diplomat)
 * Implements "Scientific Pricing" & "Resistance Point" logic.
 * Protocol: A2A (Called via 'agent.execute')
 */

class NegotiationSkill {
    constructor() {
        this.MARGIN_FLOOR = 0.7; // Never sell below 70% of list price
        this.DISCOUNT_STEP = 0.05; // 5% drops
    }

    /**
     * Evaluate an Incoming Offer
     * @param {Object} item - Product details
     * @param {number} offerPrice - The counter-party's offer
     * @param {number} currentHistory - Number of rounds
     */
    evaluate(item, offerPrice, round = 1) {
        const listPrice = item.price;
        const floorPrice = listPrice * this.MARGIN_FLOOR;

        console.log(`[Negotiator] Evaluating: Offer ${offerPrice} vs Floor ${floorPrice}`);

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
        // Strategy: Drop price by decreasing increments
        const discount = this.DISCOUNT_STEP / round;
        const counterPrice = listPrice * (1 - discount);

        return {
            action: 'COUNTER',
            price: counterPrice.toFixed(2),
            message: `Je peux faire un geste à ${counterPrice.toFixed(2)}. C'est mon offre pour valider aujourd'hui.`
        };
    }
}

module.exports = new NegotiationSkill();
