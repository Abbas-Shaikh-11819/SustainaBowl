
import requests
import json

# Test the API locally
BASE_URL = "http://localhost:5000"

def print_nutritional_profile(profile, indent=""):
    """Helper function to nicely print nutritional profile"""
    print(f"{indent}🍽️  Nutritional Profile:")
    print(f"{indent}   ⚡ Energy: {profile['energy_kcal']} kcal")
    print(f"{indent}   🥩 Proteins: {profile['proteins']}g")
    print(f"{indent}   🍞 Carbohydrates: {profile['carbohydrates']}g")
    print(f"{indent}   🥑 Fats: {profile['fats']}g") 
    print(f"{indent}   🌾 Fiber: {profile['fiber']}g")
    print(f"{indent}   🌍 Carbon: {profile['carbon_footprint']} kg CO2e")
    print(f"{indent}   ⚖️  Serving: {profile['serving_size']} ({profile['total_weight_gms']}g)")

def print_nutritional_comparison(comparison, target_name, rec_name):
    """Print nutritional differences between target and recommendation"""
    print(f"    📊 Nutritional Comparison vs {target_name}:")

    # Use color coding for differences (simplified for console)
    energy_diff = comparison['energy_diff']
    protein_diff = comparison['protein_diff']
    carb_diff = comparison['carb_diff']
    fat_diff = comparison['fat_diff']
    fiber_diff = comparison['fiber_diff']

    def format_diff(diff, unit=""):
        sign = "+" if diff > 0 else ""
        return f"{sign}{diff}{unit}"

    print(f"       ⚡ Energy: {format_diff(energy_diff, ' kcal')}")
    print(f"       🥩 Protein: {format_diff(protein_diff, 'g')}")
    print(f"       🍞 Carbs: {format_diff(carb_diff, 'g')}")
    print(f"       🥑 Fats: {format_diff(fat_diff, 'g')}")
    print(f"       🌾 Fiber: {format_diff(fiber_diff, 'g')}")

def test_health():
    response = requests.get(f"{BASE_URL}/health")
    print("Health Check:", response.json())

def test_recommendation():
    data = {
        "dish_name": "Fried Rice",
        "k": 3,
        "similarity_threshold": 0.6
    }
    response = requests.post(f"{BASE_URL}/recommend", json=data)
    result = response.json()

    print(f"\n{'='*70}")
    print(f"🎯 RECOMMENDATIONS FOR: {result['target_dish']['name']}")
    print(f"{'='*70}")

    # Display target dish nutritional profile
    print(f"\n🍽️  TARGET DISH DETAILS:")
    print(f"   📍 Region: {result['target_dish']['region']}")
    print(f"   🏷️  Category: {result['target_dish']['category']}")
    print(f"   ⚠️  Allergy: {result['target_dish']['allergy']}")
    print_nutritional_profile(result['target_dish']['nutritional_profile'], "   ")

    print(f"\n🌱 ECO-FRIENDLY RECOMMENDATIONS:")
    print(f"   Found {result['total_candidates']} alternatives, showing top {len(result['recommendations'])}")
    print(f"   💡 Average Carbon Reduction: {result['avg_carbon_reduction']} kg CO2e")

    if 'nutritional_summary' in result:
        summary = result['nutritional_summary']
        print(f"\n📊 NUTRITIONAL SUMMARY (vs Target):")
        print(f"   Average Energy Difference: {summary['avg_energy_diff']:+.1f} kcal")
        print(f"   Average Protein Difference: {summary['avg_protein_diff']:+.1f}g")
        print(f"   Average Carb Difference: {summary['avg_carb_diff']:+.1f}g")
        print(f"   Average Fat Difference: {summary['avg_fat_diff']:+.1f}g")
        print(f"   Average Fiber Difference: {summary['avg_fiber_diff']:+.1f}g")

    for i, rec in enumerate(result.get('recommendations', []), 1):
        print(f"\n{'─'*50}")
        print(f"🥗 RECOMMENDATION #{i}: {rec['name']}")
        print(f"{'─'*50}")
        print(f"📍 Region: {rec['region']} | 🏷️ Category: {rec['category']}")
        print(f"⚠️ Allergy: {rec['allergy']}")
        print(f"🔗 Similarity Score: {rec['similarity_score']} | 🏆 Eco Score: {rec['eco_score']}")
        print(f"🌍 Carbon Reduction: {rec['carbon_reduction']} kg CO2e (-{rec['carbon_reduction_pct']}%)")

        print_nutritional_profile(rec['nutritional_profile'], "")

        if 'nutritional_comparison' in rec:
            print_nutritional_comparison(
                rec['nutritional_comparison'], 
                result['target_dish']['name'],
                rec['name']
            )

        print(f"\n🥘 Ingredients: {rec['ingredients'][:100]}...")

def test_search():
    response = requests.get(f"{BASE_URL}/search?q=chicken")
    result = response.json()
    print(f"\n{'='*50}")
    print(f"🔍 SEARCH RESULTS for 'chicken': {len(result['results'])} dishes found")
    print(f"{'='*50}")

    for i, dish in enumerate(result['results'][:3], 1):  # Show first 3
        print(f"\n{i}. {dish['name']} ({dish['category']})")
        print_nutritional_profile(dish['nutritional_profile'], "   ")

def test_compare_dishes():
    data = {
        "dish_names": ["Chicken Curry", "Paneer Tikka", "Dal Cheela"]
    }
    response = requests.post(f"{BASE_URL}/compare", json=data)
    result = response.json()

    print(f"\n{'='*70}")
    print(f"⚖️  DISH COMPARISON")
    print(f"{'='*70}")

    for i, dish in enumerate(result['comparison'], 1):
        print(f"\n🍽️  DISH #{i}: {dish['name']}")
        print(f"📍 Region: {dish['region']} | 🏷️ Category: {dish['category']}")
        print_nutritional_profile(dish['nutritional_profile'], "")

def test_stats():
    response = requests.get(f"{BASE_URL}/stats")
    stats = response.json()
    print(f"\n{'='*50}")
    print(f"📊 DATASET STATISTICS")
    print(f"{'='*50}")
    print(f"Total dishes: {stats['total_dishes']}")
    print(f"Categories: {len(stats['categories'])}")
    print(f"Average carbon footprint: {stats['avg_carbon_footprint']} kg CO2e")

    if 'nutritional_stats' in stats:
        ns = stats['nutritional_stats']
        print(f"\n🍽️  Average Nutritional Values:")
        print(f"   ⚡ Energy: {ns['avg_energy']} kcal")
        print(f"   🥩 Proteins: {ns['avg_proteins']}g")
        print(f"   🍞 Carbohydrates: {ns['avg_carbohydrates']}g")
        print(f"   🥑 Fats: {ns['avg_fats']}g")
        print(f"   🌾 Fiber: {ns['avg_fiber']}g")

if __name__ == "__main__":
    print("🧪 TESTING ECOEATS API WITH NUTRITIONAL COMPARISON")
    print("Make sure Flask app is running: python app_with_nutrition.py")
    print("=" * 70)

    try:
        test_health()
        test_recommendation()
        test_search()
        test_compare_dishes()
        test_stats()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Make sure Flask app is running.")
        print("Run: python app_with_nutrition.py")
    except Exception as e:
        print(f"❌ Error: {e}")
