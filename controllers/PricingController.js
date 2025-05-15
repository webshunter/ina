const BaseController = require('./BaseController');

class PricingController extends BaseController {
    constructor(db) {
        super(db, 'pricing');
    }

    async createPlan(planData) {
        const { plan_name, description, price, features } = planData;
        return super.create({
            plan_name,
            description,
            price,
            features: JSON.stringify(features),
            is_active: true
        });
    }

    async updatePlan(id, planData) {
        const { plan_name, description, price, features, is_active } = planData;
        return super.update(id, {
            ...(plan_name && { plan_name }),
            ...(description && { description }),
            ...(price && { price }),
            ...(features && { features: JSON.stringify(features) }),
            ...(typeof is_active !== 'undefined' && { is_active })
        });
    }

    async getActivePlans() {
        return super.findAll({ is_active: 1 });
    }

    async getAllPlans() {
        return super.findAll();
    }

    async getPlanById(id) {
        return super.findById(id);
    }

    async togglePlanStatus(id, status) {
        return super.update(id, { is_active: status });
    }

    async deletePlan(id) {
        return super.delete(id);
    }
}

module.exports = PricingController; 