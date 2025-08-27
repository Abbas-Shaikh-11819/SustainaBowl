class AboutPage {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.ingredients = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadIngredients();
    }

    setupEventListeners() {
        // Ingredient database link
        document.getElementById('ingredientDbLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showIngredientModal();
        });

        // Search functionality in modal
        document.getElementById('ingredientSearch').addEventListener('input', (e) => {
            this.filterIngredients(e.target.value);
        });
    }

    async loadIngredients() {
        try {
            const response = await fetch(`${this.apiUrl}/stats`);
            const data = await response.json();
            
            // Get ingredients from all dishes
            const dishResponse = await fetch(`${this.apiUrl}/search?q=`);
            const dishData = await dishResponse.json();
            
            // Extract ingredients from CSV data
            this.extractIngredients();
        } catch (error) {
            console.error('Error loading ingredients:', error);
        }
    }

    extractIngredients() {
        // This would extract from your CSV data
        // For now, I'll add common ingredients based on your data structure
        const commonIngredients = [
            'Onion', 'Tomato', 'Garlic', 'Ginger', 'Cumin seeds', 'Coriander leaves',
            'Common salt', 'Red chilli Powder', 'Turmeric powder', 'Cooking oil',
            'Capsicum', 'Carrot', 'Potato', 'Peas', 'Cucumber', 'Lettuce Leaf',
            'Black pepper', 'Lemon', 'Coriander Powder', 'Garam Masala',
            'Chicken', 'Rice', 'Wheat', 'Milk', 'Yoghurt', 'Paneer',
            'Dal', 'Chickpeas', 'Spinach', 'Cauliflower', 'Broccoli',
            'Mushroom', 'Beans', 'Cabbage', 'Mint leaves', 'Parsley',
            'Olive oil', 'Coconut', 'Almonds', 'Cashew', 'Peanuts',
            'Soyabean', 'Tofu', 'Egg', 'Fish', 'Mutton', 'Prawn'
        ];

        commonIngredients.forEach(ingredient => this.ingredients.add(ingredient));
    }

    showIngredientModal() {
        this.displayIngredients(Array.from(this.ingredients));
        const modal = new bootstrap.Modal(document.getElementById('ingredientModal'));
        modal.show();
    }

    displayIngredients(ingredients) {
        const container = document.getElementById('ingredientList');
        
        if (ingredients.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No ingredients found.</p>';
            return;
        }

        container.innerHTML = ingredients.map(ingredient => `
            <div class="ingredient-card">
                <div class="ingredient-icon">
                    <i class="fas fa-seedling"></i>
                </div>
                <div class="ingredient-name">${ingredient}</div>
                <div class="ingredient-usage">Used in multiple dishes</div>
            </div>
        `).join('');
    }

    filterIngredients(query) {
        if (!query.trim()) {
            this.displayIngredients(Array.from(this.ingredients));
            return;
        }

        const filtered = Array.from(this.ingredients).filter(ingredient =>
            ingredient.toLowerCase().includes(query.toLowerCase())
        );
        
        this.displayIngredients(filtered);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AboutPage();
});
