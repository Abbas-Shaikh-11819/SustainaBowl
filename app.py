from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

class EcoEatsRecommender:
    def __init__(self, df):
        self.df = df.copy()
        self.feature_cols = ['Energy(kcal)', 'Proteins', 'Carbohydrates', 'Fats', 'Fiber', 'Carbon Footprint(kg CO2e)']
        self.scaler = StandardScaler()
        self.X_scaled = None
        self.prepare_features()

    def prepare_features(self):
        """Prepare and scale features for similarity calculation"""
        X = self.df[self.feature_cols].values
        self.X_scaled = self.scaler.fit_transform(X)

    def find_dish(self, dish_name):
        """Find dish by name (exact or partial match)"""
        exact = self.df[self.df['Food'].str.lower() == dish_name.lower()]
        if not exact.empty:
            return exact.index[0]
        partial = self.df[self.df['Food'].str.contains(dish_name, case=False, na=False)]
        if not partial.empty:
            return partial.index[0]
        return None

    def get_eco_recommendations(self, dish_name, k=5, similarity_threshold=0.6, same_category=False):
        """Get eco-friendly recommendations with nutritional profiles"""
        dish_idx = self.find_dish(dish_name)
        if dish_idx is None:
            return {"error": f"Dish '{dish_name}' not found"}

        target_row = self.df.iloc[dish_idx]
        target_profile = {
            'Total_weight': int(target_row['Total Weight (gms)']),
            'energy_kcal': int(target_row['Energy(kcal)']),
            'proteins': float(target_row['Proteins']),
            'carbohydrates': float(target_row['Carbohydrates']),
            'fats': float(target_row['Fats']),
            'fiber': float(target_row['Fiber'])
        }
        target_carbon = target_row['Carbon Footprint(kg CO2e)']

        # similarity
        vec = self.X_scaled[dish_idx].reshape(1, -1)
        sims = cosine_similarity(vec, self.X_scaled)[0]
        candidates = self.df.copy()
        candidates['similarity_score'] = sims

        eco = candidates[
            (candidates['Carbon Footprint(kg CO2e)'] < target_carbon) &
            (candidates.index != dish_idx) &
            (candidates['similarity_score'] > similarity_threshold)
        ].copy()

        if same_category:
            eco = eco[eco['Category'] == target_row['Category']]

        if eco.empty:
            return {
                "target_dish": target_row['Food'],
                "target_profile": target_profile,
                "target_carbon": round(target_carbon, 3),
                "recommendations": [],
                "message": "No eco-friendly alternatives found"
            }

        eco['carbon_reduction'] = target_carbon - eco['Carbon Footprint(kg CO2e)']
        eco['carbon_reduction_pct'] = (eco['carbon_reduction'] / target_carbon) * 100
        eco['eco_score'] = eco['similarity_score'] * 0.7 + (eco['carbon_reduction'] / target_carbon) * 0.3

        top = eco.nlargest(k, 'eco_score')
        recs = []
        for _, r in top.iterrows():
            recs.append({
                'name': r['Food'],
                'Total_weight': r['Total Weight (gms)'],
                'category': r['Category'],
                'region': r['Region'],
                'type': r['Type'],
                'allergy': r['Allergy'],
                'ingredients': r['Ingredients'],
                'carbon_footprint': round(r['Carbon Footprint(kg CO2e)'], 3),
                'carbon_reduction': round(r['carbon_reduction'], 3),
                'carbon_reduction_pct': round(r['carbon_reduction_pct'], 1),
                'similarity_score': round(r['similarity_score'], 3),
                'eco_score': round(r['eco_score'], 3),
                'nutritional_profile': {
                    'energy_kcal': int(r['Energy(kcal)']),
                    'proteins': float(r['Proteins']),
                    'carbohydrates': float(r['Carbohydrates']),
                    'fats': float(r['Fats']),
                    'fiber': float(r['Fiber'])
                }
            })

        return {
            "target_dish": target_row['Food'],
            "target_profile": target_profile,
            "target_carbon": round(target_carbon, 3),
            "target_category": target_row['Category'],
            "recommendations": recs,
            "total_candidates": len(eco),
            "avg_carbon_reduction": round(eco['carbon_reduction'].mean(), 3)
        }


# global
recommender = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "EcoEats ML API is running"})

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    data = request.get_json() or {}
    if 'dish_name' not in data:
        return jsonify({"error": "dish_name is required"}), 400
    result = recommender.get_eco_recommendations(
        data['dish_name'],
        k=data.get('k', 5),
        similarity_threshold=data.get('similarity_threshold', 0.6),
        same_category=data.get('same_category', False)
    )
    return jsonify(result)

@app.route('/search', methods=['GET'])
def search_dishes():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    df = recommender.df
    matches = df[df['Food'].str.contains(q, case=False, na=False)].head(10)
    results = []
    for _, r in matches.iterrows():
        results.append({
            'name': r['Food'],
            'category': r['Category'],
            'carbon_footprint': round(r['Carbon Footprint(kg CO2e)'], 3),
            'energy_kcal': int(r['Energy(kcal)'])
        })
    return jsonify({"results": results})

@app.route('/stats', methods=['GET'])
def get_stats():
    df = recommender.df
    return jsonify({
        "total_dishes": len(df),
        "categories": df['Category'].unique().tolist(),
        "avg_carbon_footprint": round(df['Carbon Footprint(kg CO2e)'].mean(), 3),
        "carbon_footprint_range": {
            "min": round(df['Carbon Footprint(kg CO2e)'].min(), 3),
            "max": round(df['Carbon Footprint(kg CO2e)'].max(), 3)
        },
        "regions": df['Region'].unique().tolist()[:10],
        "allergens": df['Allergy'].unique().tolist()[:10]
    })

@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="Internal Server Error", details=str(e)), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Not Found"), 404

def initialize_recommender():
    global recommender
    base = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base, 'data', 'nutrition_ds.csv')
    df = pd.read_csv(path)
    numeric = ['Energy(kcal)', 'Proteins', 'Carbohydrates', 'Fats', 'Fiber', 'Carbon Footprint(kg CO2e)']
    for c in numeric:
        df[c] = pd.to_numeric(df[c], errors='coerce')
    df[numeric] = df[numeric].fillna(df[numeric].mean())
    recommender = EcoEatsRecommender(df)
    print("✅ EcoEats Recommender initialized successfully!")

initialize_recommender()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
