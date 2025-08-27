// EcoEats Frontend JavaScript

class EcoEatsApp {
    constructor() {
        this.apiUrl = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://sustainabowl.onrender.com";

        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.carousel-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.nutritionChart = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startCarousel();
        this.setupScrollIndicator();
    }

    setupEventListeners() {
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const dishInput = document.getElementById('dishInput');

        searchBtn.addEventListener('click', () => this.searchDish());
        dishInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchDish();
        });

        // Auto-suggestions
        dishInput.addEventListener('input', (e) => this.handleInputChange(e));

        // Carousel indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        // Smooth scrolling for navigation
        document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        // If it's an in-page anchor (starts with #), smooth scroll
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
        // else → let the browser handle (about.html will work 🚀)
    });
});

    }

    async searchDish() {
        const dishName = document.getElementById('dishInput').value.trim();
        if (!dishName) return;

        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}/recommend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dish_name: dishName,
                    k: 3,
                    similarity_threshold: 0.6
                })
            });

            const data = await response.json();

            if (data.error) {
                this.showError(data.error);
                return;
            }

            this.displayResults(data);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to fetch recommendations. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async handleInputChange(e) {
        const query = e.target.value.trim();
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.showSuggestions(data.results || []);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('searchSuggestions');

        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestionsContainer.innerHTML = suggestions.slice(0, 5).map(item => `
            <div class="suggestion-item" onclick="app.selectSuggestion('${item.name}')">
                <i class="fas fa-utensils"></i>
                <div>
                    <div style="font-weight: 500;">${item.name}</div>
                    <div style="font-size: 0.8rem; color: var(--gray-500);">
                        ${item.category} • ${item.carbon_footprint} kg CO₂
                    </div>
                </div>
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';
    }

    hideSuggestions() {
        document.getElementById('searchSuggestions').style.display = 'none';
    }

    selectSuggestion(dishName) {
        document.getElementById('dishInput').value = dishName;
        this.hideSuggestions();
        this.searchDish();
    }

    displayResults(data) {
        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });

        // Update target dish info
        document.getElementById('targetDishName').textContent = data.target_dish+' ('+data.target_profile.Total_weight+' gm)';
        console.log(data)
        document.getElementById('targetCarbon').textContent = `${data.target_carbon} kg CO₂`;

        // Create nutritional chart
        this.createNutritionChart(data);

        // Display impact visualizations
        this.displayImpactVisualizations(data.target_carbon);

        // Display recommendations
        this.displayRecommendations(data.recommendations, data.target_profile);
    }


    createNutritionChart(data) {
        const ctx = document.getElementById('nutritionChart').getContext('2d');
        if (window.targetChart) window.targetChart.destroy();
        const nut = data.target_profile;
        console.log(nut)
        window.targetChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Protein', 'Carbs', 'Fats', 'Fiber'],
                datasets: [{
                    data: [nut.proteins, nut.carbohydrates, nut.fats, nut.fiber],
                    backgroundColor: [
                        'rgba(33,128,141,0.7)',
                        'rgba(64,160,133,0.7)',
                        'rgba(98,108,113,0.7)',
                        'rgba(230,129,97,0.7)'
                    ],
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: { legend: { position: 'bottom' } },
                maintainAspectRatio: false
            }
        });
        this.displayNutritionDetails(nut);
    }


    extractNutritionData(data) {
        // For demo purposes, we'll use sample data
        // In production, this would come from the API response
        return {
            energy: 285,
            proteins: 22,
            carbs: 8,
            fats: 18,
            fiber: 2
        };
    }

    displayNutritionDetails(nutrition) {
        const detailsContainer = document.getElementById('nutritionDetails');
        detailsContainer.innerHTML = `
            <div class="nutrition-item">
                <div class="nutrition-value">${nutrition.energy_kcal}</div>
                <div class="nutrition-label">Calories</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-value">${nutrition.proteins}g</div>
                <div class="nutrition-label">Protein</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-value">${nutrition.carbohydrates}g</div>
                <div class="nutrition-label">Carbs</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-value">${nutrition.fats}g</div>
                <div class="nutrition-label">Fats</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-value">${nutrition.fiber}g</div>
                <div class="nutrition-label">Fiber</div>
            </div>
        `;
    }

    displayImpactVisualizations(carbonFootprint) {
        const container = document.getElementById('impactVisualizations');

        const comparisons = [
            {
                icon: '🚗',
                title: 'Car Distance',
                description: 'Equivalent to driving',
                value: `${(carbonFootprint * 6.3).toFixed(1)} km`,
                details: 'in a petrol car'
            },
            {
                icon: '🏍️',
                title: 'Motorbike Ride',
                description: 'Same as riding',
                value: `${(carbonFootprint * 16.7).toFixed(1)} km`,
                details: 'on Honda Activa 5G'
            },
            {
                icon: '🏭',
                title: 'Coal Burning',
                description: 'Equal to burning',
                value: `${(carbonFootprint * 2.5).toFixed(1)} kg`,
                details: 'of coal for electricity'
            },
            {
                icon: '💡',
                title: 'Home Energy',
                description: 'Powers your home for',
                value: `${(carbonFootprint * 2.2).toFixed(1)} hours`,
                details: 'average consumption'
            }
        ];

        container.innerHTML = comparisons.map(comp => `
            <div class="impact-comparison">
                <div class="impact-icon">${comp.icon}</div>
                <div class="impact-details">
                    <h5>${comp.title}</h5>
                    <p>${comp.description} ${comp.details}</p>
                </div>
                <div class="impact-value">${comp.value}</div>
            </div>
        `).join('');
    }

    displayRecommendations(recs, targetProfile) {
    const grid = document.getElementById('recommendationsGrid');
    grid.innerHTML = recs.map((r, i) => `
    <div class="recommendation-card">
      <div class="rec-header">
        <h4>${r.name} (${r.Total_weight} gm)</h4>
        <div class="eco-score"><i class="fas fa-leaf"></i> ${Math.round(r.eco_score * 100)}%</div>
      </div>
      <div class="carbon-reduction">
        <i class="fas fa-arrow-down"></i>
        <div>${r.carbon_reduction} kg CO₂ saved</div>
        <div class="reduction-percentage">-${r.carbon_reduction_pct}%</div>
      </div>
      <div class="rec-details">
        <div><i class="fas fa-map-marker-alt"></i> ${r.region}</div>
        <div><i class="fas fa-tag"></i> ${r.category}</div>
      </div>
      <div class="rec-nutrition">
        <h5>Nutrition Breakdown</h5>
        <div class="rec-chart-container">
          <canvas id="recChart_${i}"></canvas>
        </div>
        <div class="rec-nutrition-grid" id="recNutriGrid_${i}"></div>
      </div>
    </div>
  `).join('');

    recs.forEach((r, i) => {
        // fill grid
        const gridEl = document.getElementById(`recNutriGrid_${i}`);
        gridEl.innerHTML = `
      <div class="nutrition-item"><div class="nutrition-value">${r.nutritional_profile.proteins}g</div><div class="nutrition-label">Protein</div></div>
      <div class="nutrition-item"><div class="nutrition-value">${r.nutritional_profile.carbohydrates}g</div><div class="nutrition-label">Carbs</div></div>
      <div class="nutrition-item"><div class="nutrition-value">${r.nutritional_profile.fats}g</div><div class="nutrition-label">Fats</div></div>
      <div class="nutrition-item"><div class="nutrition-value">${r.nutritional_profile.fiber}g</div><div class="nutrition-label">Fiber</div></div>
      <div class="nutrition-item"><div class="nutrition-value">${r.nutritional_profile.energy_kcal}</div><div class="nutrition-label">Energy</div></div>
    `;
        // draw pie
        const ctx = document.getElementById(`recChart_${i}`).getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Protein', 'Carbs', 'Fats', 'Fiber'],
                datasets: [{
                    data: [r.nutritional_profile.proteins, r.nutritional_profile.carbohydrates, r.nutritional_profile.fats, r.nutritional_profile.fiber],
                    backgroundColor: [
                        'rgba(33,128,141,0.7)',
                        'rgba(64,160,133,0.7)',
                        'rgba(98,108,113,0.7)',
                        'rgba(230,129,97,0.7)'
                    ],
                    borderColor: 'white', borderWidth: 2
                }]
            },
            options: {
                plugins: { legend: { position : 'left' } },
                maintainAspectRatio: false
            }
        });
    });
}

showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
}

hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

showError(message) {
    // Simple error display - you can enhance this
    alert(`Error: ${message}`);
}

// Carousel functionality
startCarousel() {
    setInterval(() => {
        this.nextSlide();
    }, 6000); // Change slide every 6 seconds
}

goToSlide(index) {
    this.slides[this.currentSlide].classList.remove('active');
    this.indicators[this.currentSlide].classList.remove('active');

    this.currentSlide = index;

    this.slides[this.currentSlide].classList.add('active');
    this.indicators[this.currentSlide].classList.add('active');
}

nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
}

setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            document.getElementById('discover').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

}

// Additional utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const change = end - start;

    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = start + (change * easeOutQuart(progress));
        element.textContent = Math.floor(current);

        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }

    requestAnimationFrame(updateValue);
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EcoEatsApp();
});

// Add some interactive features
document.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = 'var(--shadow-md)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.fact-card, .chart-card, .impact-card, .recommendation-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});

