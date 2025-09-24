
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from datetime import datetime, timedelta
import json
import pickle
import warnings
warnings.filterwarnings('ignore')

# Load the large synthetic dataset
df = pd.read_csv('large_agri_dataset.csv')

class EnhancedCropCyclePredictionModel:
    def __init__(self):
        self.yield_model = None
        self.cycle_models = {}
        self.feature_columns = None
        self.metrics = {}
        self.phenology_data = {
            'Rice': {'base_temp': 10, 'stages': {0: 'Germination', 1: 'Leaf Development', 2: 'Tillering', 3: 'Stem Elongation', 5: 'Heading', 6: 'Flowering', 7: 'Grain Filling', 8: 'Maturity'}},
            'Wheat': {'base_temp': 4, 'stages': {0: 'Germination', 1: 'Leaf Development', 2: 'Tillering', 3: 'Stem Elongation', 5: 'Heading', 6: 'Flowering', 7: 'Grain Filling', 8: 'Maturity'}},
            'Maize': {'base_temp': 10, 'stages': {0: 'Germination', 1: 'Leaf Development', 3: 'Stem Elongation', 5: 'Tasseling', 6: 'Silking', 7: 'Grain Filling', 8: 'Maturity'}},
            'Cotton': {'base_temp': 15, 'stages': {0: 'Germination', 1: 'Leaf Development', 3: 'Stem Elongation', 5: 'Squaring', 6: 'Flowering', 7: 'Boll Development', 8: 'Boll Opening'}},
            'Soybean': {'base_temp': 10, 'stages': {0: 'Germination', 1: 'Leaf Development', 3: 'Stem Elongation', 6: 'Flowering', 7: 'Pod Development', 8: 'Maturity'}},
            'Sugarcane': {'base_temp': 18, 'stages': {0: 'Germination', 1: 'Tillering', 3: 'Grand Growth', 8: 'Maturity'}}
        }

    def prepare_features(self, df_input):
        """Prepare features for training - using only basic features available at sowing"""
        # Use basic features that would be available at sowing time
        basic_features = ['Avg_Temp', 'Tmax', 'Tmin']

        # Create crop type dummy variables
        crop_dummies = pd.get_dummies(df_input['Crop_Type'], prefix='Crop')

        # Combine features
        feature_data = pd.concat([
            df_input[basic_features],
            crop_dummies
        ], axis=1)

        return feature_data

    def train_models(self, df):
        """Train yield and phenology prediction models"""
        print("🚀 TRAINING ENHANCED CROP CYCLE PREDICTION MODELS")
        print("="*60)

        # Prepare features
        X = self.prepare_features(df)
        self.feature_columns = X.columns.tolist()

        # Train yield prediction model
        print("Training yield prediction model...")
        y_yield = df['Actual_Yield']
        X_train, X_test, y_train, y_test = train_test_split(X, y_yield, test_size=0.2, random_state=42)

        self.yield_model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=15)
        self.yield_model.fit(X_train, y_train)

        # Evaluate yield model
        y_pred = self.yield_model.predict(X_test)
        r2_yield = r2_score(y_test, y_pred)
        rmse_yield = np.sqrt(mean_squared_error(y_test, y_pred))
        self.metrics['yield'] = {'r2': r2_yield, 'rmse': rmse_yield}

        print(f"✅ Yield Model - R²: {r2_yield:.3f}, RMSE: {rmse_yield:.3f}")

        # Train phenology models for different targets
        phenology_targets = [
            'Days_To_Maturity',
            'Total_Season_Length_Predicted',
            'Germination_Days_From_Sowing',
            'Reproductive_Days_From_Sowing',
            'Grain_Filling_Days_From_Sowing'
        ]

        for target in phenology_targets:
            if target in df.columns:
                print(f"Training {target} prediction model...")
                y_target = df[target]

                X_train_t, X_test_t, y_train_t, y_test_t = train_test_split(X, y_target, test_size=0.2, random_state=42)

                model = RandomForestRegressor(n_estimators=80, random_state=42, max_depth=12)
                model.fit(X_train_t, y_train_t)
                self.cycle_models[target] = model

                # Evaluate model
                y_pred_t = model.predict(X_test_t)
                r2_t = r2_score(y_test_t, y_pred_t)
                rmse_t = np.sqrt(mean_squared_error(y_test_t, y_pred_t))
                self.metrics[target] = {'r2': r2_t, 'rmse': rmse_t}

                print(f"✅ {target} - R²: {r2_t:.3f}, RMSE: {rmse_t:.3f}")

        print("\n🎯 MODEL TRAINING COMPLETE!")
        print(f"   Trained {len(self.cycle_models) + 1} models successfully")

    def save_model(self, filename='agri_forecasting_model.pkl'):
        """Save the complete trained model to pickle file"""
        try:
            model_data = {
                'yield_model': self.yield_model,
                'cycle_models': self.cycle_models,
                'feature_columns': self.feature_columns,
                'metrics': self.metrics,
                'phenology_data': self.phenology_data,
                'model_version': '2.0',
                'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'dataset_size': len(df)
            }

            with open(filename, 'wb') as f:
                pickle.dump(model_data, f)

            print(f"\n💾 MODEL SAVED SUCCESSFULLY!")
            print(f"   File: {filename}")
            print(f"   Size: {round(pd.Series([filename]).apply(lambda x: __import__('os').path.getsize(x) / 1024 / 1024).iloc[0], 2)} MB")
            print(f"   Contains: Yield model + {len(self.cycle_models)} phenology models")
            return True

        except Exception as e:
            print(f"❌ ERROR SAVING MODEL: {str(e)}")
            return False

    @classmethod
    def load_model(cls, filename='agri_forecasting_model.pkl'):
        """Load a trained model from pickle file"""
        try:
            with open(filename, 'rb') as f:
                model_data = pickle.load(f)

            # Create new instance
            model = cls()

            # Restore model components
            model.yield_model = model_data['yield_model']
            model.cycle_models = model_data['cycle_models']
            model.feature_columns = model_data['feature_columns']
            model.metrics = model_data['metrics']
            model.phenology_data = model_data['phenology_data']

            print(f"\n📂 MODEL LOADED SUCCESSFULLY!")
            print(f"   File: {filename}")
            print(f"   Version: {model_data.get('model_version', 'Unknown')}")
            print(f"   Training Date: {model_data.get('training_date', 'Unknown')}")
            print(f"   Dataset Size: {model_data.get('dataset_size', 'Unknown')} records")

            return model

        except Exception as e:
            print(f"❌ ERROR LOADING MODEL: {str(e)}")
            return None

    def predict_with_current_date(self, crop_type, avg_temp, tmax, tmin, sowing_date=None):
        """Predict crop cycle using current date or specified sowing date"""

        if sowing_date is None:
            sowing_date = datetime.now().strftime('%Y-%m-%d')

        # Prepare input features
        input_data = pd.DataFrame({
            'Crop_Type': [crop_type],
            'Avg_Temp': [avg_temp],
            'Tmax': [tmax],
            'Tmin': [tmin]
        })

        X_input = self.prepare_features(input_data)

        # Ensure all training features are present
        for col in self.feature_columns:
            if col not in X_input.columns:
                X_input[col] = 0

        X_input = X_input[self.feature_columns]

        # Predict yield
        yield_pred = self.yield_model.predict(X_input)[0]

        # Get yield confidence interval
        tree_preds = np.array([tree.predict(X_input)[0] for tree in self.yield_model.estimators_])
        yield_ci_lower = np.percentile(tree_preds, 5)
        yield_ci_upper = np.percentile(tree_preds, 95)

        # Predict phenological timing
        predictions = {'yield': yield_pred}
        for target, model in self.cycle_models.items():
            predictions[target] = int(model.predict(X_input)[0])

        # Calculate crop cycle dates
        sowing_dt = datetime.strptime(sowing_date, '%Y-%m-%d')

        # Create growth stage timeline
        growth_stages = {}
        if crop_type in self.phenology_data:
            stages = self.phenology_data[crop_type]['stages']

            # Use predicted timing or defaults
            season_length = predictions.get('Total_Season_Length_Predicted', 120)

            stage_proportions = {
                0: 0.06,   # Germination: 6% of season
                1: 0.20,   # Leaf Development: 20%
                2: 0.35,   # Tillering: 35%
                3: 0.50,   # Stem Elongation: 50%
                5: 0.65,   # Reproductive: 65%
                6: 0.72,   # Flowering: 72%
                7: 0.85,   # Grain Filling: 85%
                8: 1.00    # Maturity: 100%
            }

            for stage_code, stage_name in stages.items():
                if stage_code in stage_proportions:
                    days_from_sowing = int(season_length * stage_proportions[stage_code])
                    stage_date = sowing_dt + timedelta(days=days_from_sowing)

                    growth_stages[f"stage_{stage_code}"] = {
                        "name": stage_name,
                        "bbch_code": stage_code,
                        "days_from_sowing": days_from_sowing,
                        "predicted_date": stage_date.strftime('%Y-%m-%d')
                    }

        # Calculate harvest window
        days_to_maturity = predictions.get('Days_To_Maturity', season_length)
        maturity_date = sowing_dt + timedelta(days=days_to_maturity)
        harvest_start = maturity_date + timedelta(days=5)
        harvest_end = maturity_date + timedelta(days=15)

        # Feature importance
        feature_importances = [
            {"name": self.feature_columns[i], "impact": round(importance, 3)}
            for i, importance in enumerate(self.yield_model.feature_importances_)
        ]
        feature_importances = sorted(feature_importances, key=lambda x: x['impact'], reverse=True)[:4]

        return {
            "prediction": {
                "yield_t_ha": round(yield_pred, 2),
                "ci_lower": round(yield_ci_lower, 2),
                "ci_upper": round(yield_ci_upper, 2),
                "crop_type": crop_type
            },
            "crop_cycle": {
                "sowing_date": sowing_date,
                "season_length_days": predictions.get('Total_Season_Length_Predicted'),
                "days_to_maturity": days_to_maturity,
                "predicted_maturity_date": maturity_date.strftime('%Y-%m-%d'),
                "harvest_window": {
                    "start": harvest_start.strftime('%Y-%m-%d'),
                    "end": harvest_end.strftime('%Y-%m-%d')
                },
                "growth_stages": growth_stages
            },
            "feature_importances": feature_importances,
            "explanation_text": f"Prediction for {crop_type} sown on {sowing_date}: {yield_pred:.1f} tons/ha expected yield with maturity in {days_to_maturity} days."
        }

# Usage Example
if __name__ == "__main__":
    # Initialize and train model
    model = EnhancedCropCyclePredictionModel()
    model.train_models(df)

    # 💾 SAVE THE TRAINED MODEL TO PICKLE FILE
    model.save_model('agri_forecasting_model.pkl')

    print("\n" + "="*60)
    print("🧪 TESTING MODEL SAVE/LOAD FUNCTIONALITY")
    print("="*60)

    # Test loading the model
    loaded_model = EnhancedCropCyclePredictionModel.load_model('agri_forecasting_model.pkl')

    if loaded_model:
        print("\n✅ MODEL LOAD TEST SUCCESSFUL!")

        # Test prediction with loaded model
        test_prediction = loaded_model.predict_with_current_date(
            crop_type="Rice",
            avg_temp=28.5,
            tmax=35.2,
            tmin=22.1,
            sowing_date="2025-09-24"
        )

        print("\n🌾 TEST PREDICTION WITH LOADED MODEL:")
        print(json.dumps(test_prediction, indent=2))

    print("\n" + "="*60)
    print("📁 FILES GENERATED:")
    print("✅ large_synthetic_agri_dataset.csv")
    print("✅ agri_forecasting_model.pkl (TRAINED MODEL)")
    print("\n🎯 TO USE SAVED MODEL IN PRODUCTION:")
    print("   model = EnhancedCropCyclePredictionModel.load_model('agri_forecasting_model.pkl')")
    print("   result = model.predict_with_current_date('Rice', 28.5, 35.2, 22.1)")
