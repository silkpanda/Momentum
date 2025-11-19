// =========================================================
// silkpanda/momentum/app/components/meals/MealDashboard.tsx
// Main dashboard for Meals feature with tabs
// =========================================================
'use client';

import React, { useState } from 'react';
import RecipeList, { IRecipe } from './RecipeList';
import RestaurantList, { IRestaurant } from './RestaurantList';
import MealPlanList, { IMealPlan } from './MealPlanList';

interface MealDashboardProps {
    recipes: IRecipe[];
    restaurants: IRestaurant[];
    mealPlans: IMealPlan[];
}

const MealDashboard: React.FC<MealDashboardProps> = ({ recipes, restaurants, mealPlans }) => {
    const [activeTab, setActiveTab] = useState<'plans' | 'recipes' | 'restaurants'>('plans');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Meals & Dining</h1>
                <p className="text-text-secondary">Manage recipes, favorite restaurants, and weekly meal plans.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border-subtle">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'plans'
                                ? 'border-action-primary text-action-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
                            }`}
                    >
                        Meal Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('recipes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'recipes'
                                ? 'border-action-primary text-action-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
                            }`}
                    >
                        Recipes
                    </button>
                    <button
                        onClick={() => setActiveTab('restaurants')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'restaurants'
                                ? 'border-action-primary text-action-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
                            }`}
                    >
                        Restaurants
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="pt-2">
                {activeTab === 'plans' && <MealPlanList mealPlans={mealPlans} />}
                {activeTab === 'recipes' && <RecipeList recipes={recipes} />}
                {activeTab === 'restaurants' && <RestaurantList restaurants={restaurants} />}
            </div>
        </div>
    );
};

export default MealDashboard;
