
# IRRIGATION SCHEDULING INTEGRATION
# This shows how crop cycle predictions can optimize irrigation timing

def generate_irrigation_schedule(crop_cycle_prediction, field_data):
    """Generate irrigation schedule based on crop growth stages"""

    irrigation_schedule = []
    growth_stages = crop_cycle_prediction['crop_cycle']['growth_stages']

    # Define irrigation requirements for each growth stage
    irrigation_needs = {
        0: {'frequency': 'daily', 'amount': 'light', 'priority': 'high'},      # Germination
        1: {'frequency': '2-3 days', 'amount': 'moderate', 'priority': 'high'}, # Leaf Development
        2: {'frequency': '3-4 days', 'amount': 'moderate', 'priority': 'medium'}, # Tillering
        3: {'frequency': '2-3 days', 'amount': 'heavy', 'priority': 'high'},    # Stem Elongation
        5: {'frequency': '2 days', 'amount': 'heavy', 'priority': 'critical'},  # Heading
        6: {'frequency': 'daily', 'amount': 'heavy', 'priority': 'critical'},   # Flowering
        7: {'frequency': '2-3 days', 'amount': 'heavy', 'priority': 'high'},    # Grain Filling
        8: {'frequency': 'reduce', 'amount': 'light', 'priority': 'low'}        # Maturity
    }

    for stage_key, stage_info in growth_stages.items():
        bbch_code = stage_info['bbch_code']
        if bbch_code in irrigation_needs:
            irrigation_req = irrigation_needs[bbch_code]

            irrigation_schedule.append({
                'growth_stage': stage_info['name'],
                'stage_date': stage_info['predicted_date'],
                'days_from_sowing': stage_info['days_from_sowing'],
                'irrigation_frequency': irrigation_req['frequency'],
                'water_amount': irrigation_req['amount'],
                'priority': irrigation_req['priority'],
                'recommendation': f"Apply {irrigation_req['amount']} irrigation every {irrigation_req['frequency']} during {stage_info['name']} stage"
            })

    return {
        'field_id': field_data.get('field_id', 'unknown'),
        'crop_type': crop_cycle_prediction['prediction']['crop_type'],
        'total_season_days': crop_cycle_prediction['crop_cycle']['season_length_days'],
        'irrigation_schedule': irrigation_schedule,
        'water_efficiency_tips': [
            "Use drip irrigation during critical flowering stage",
            "Reduce irrigation 10 days before harvest",
            "Monitor soil moisture levels daily during heading stage",
            "Apply mulching to reduce water evaporation"
        ]
    }

# Example usage
sample_field = {'field_id': 'FIELD_001', 'soil_type': 'Alluvial', 'size_ha': 2.5}
irrigation_plan = generate_irrigation_schedule(enhanced_prediction_example, sample_field)

print("💧 IRRIGATION SCHEDULE INTEGRATION:")
print("="*50)
print(f"Field: {irrigation_plan['field_id']}")
print(f"Crop: {irrigation_plan['crop_type']}")
print(f"Season Length: {irrigation_plan['total_season_days']} days")
print("\nIrrigation Schedule:")
for i, schedule in enumerate(irrigation_plan['irrigation_schedule'], 1):
    print(f"{i}. {schedule['growth_stage']} ({schedule['stage_date']})")
    print(f"   → {schedule['recommendation']}")
    print(f"   → Priority: {schedule['priority']}")
    print()
