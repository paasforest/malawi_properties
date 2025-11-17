# 🤖 ML Architecture - Auto-Learning & Activation System

## 🎯 Vision

Build a machine learning system that:
1. **Learns continuously** from collected data as it grows
2. **Activates automatically** when enough data is available
3. **Provides actionable insights** for the real estate market
4. **Improves over time** without manual intervention

---

## 📊 Data Collection Strategy

### Current Data Sources (Already Collecting)
1. **Property Data**
   - Prices, locations, sizes, types
   - Views, inquiries, time-to-sale
   - Property features (bedrooms, bathrooms, plot size)

2. **Buyer Intelligence**
   - Diaspora locations (SA, UK, USA, etc.)
   - Budget ranges
   - Intended use (home build, rental, investment)
   - Payment preferences
   - Viewing behavior

3. **Market Trends**
   - District popularity
   - Price trends over time
   - Seasonal patterns
   - Demand indicators

---

## 🧠 ML Models to Build

### Phase 1: Price Prediction (Early Activation)
**Goal:** Predict property prices based on features

**Minimum Data Required:**
- 50+ properties with prices
- At least 3 districts with data
- Plot sizes and property types

**Features:**
- District
- Property type
- Plot size
- Bedrooms/bathrooms (for houses)
- Market conditions

**Activation Threshold:** 50 properties

**Output:** Price range prediction (e.g., "MK 15M - 20M")

---

### Phase 2: Demand Forecasting (Medium Data)
**Goal:** Predict which properties will get inquiries

**Minimum Data Required:**
- 200+ properties
- 500+ views
- 100+ inquiries

**Features:**
- Property attributes
- Historical view/inquiry patterns
- District popularity
- Time of year
- Property age (days listed)

**Activation Threshold:** 200 properties, 100 inquiries

**Output:** Inquiry probability score (0-100%)

---

### Phase 3: Buyer Matching (Rich Data)
**Goal:** Match buyers with properties they'll likely inquire about

**Minimum Data Required:**
- 500+ properties
- 1000+ inquiries
- Buyer preference patterns

**Features:**
- Buyer location (diaspora/local)
- Budget range
- Intended use
- Property features
- Historical buyer behavior

**Activation Threshold:** 500 properties, 1000 inquiries

**Output:** Personalized property recommendations

---

### Phase 4: Market Trend Prediction (Advanced)
**Goal:** Predict market trends (price increases, demand shifts)

**Minimum Data Required:**
- 12+ months of data
- 1000+ properties
- Seasonal patterns visible

**Features:**
- Historical price trends
- Seasonal patterns
- District growth rates
- Diaspora investment patterns

**Activation Threshold:** 12 months of data

**Output:** 3-6 month trend forecasts

---

## 🏗️ Architecture Design

### Database Schema

```sql
-- ML Models Registry
CREATE TABLE ml_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL, -- 'price_predictor', 'demand_forecast', etc.
  model_type text NOT NULL, -- 'regression', 'classification', 'recommendation'
  status text NOT NULL, -- 'pending', 'training', 'active', 'deprecated'
  minimum_data_points integer NOT NULL, -- Threshold for activation
  current_data_points integer DEFAULT 0,
  training_data_count integer DEFAULT 0,
  accuracy_metrics jsonb DEFAULT '{}', -- Store accuracy, MAE, etc.
  model_version integer DEFAULT 1,
  last_trained_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ML Predictions Cache
CREATE TABLE ml_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ml_models(id),
  resource_type text NOT NULL, -- 'property', 'buyer', 'market'
  resource_id uuid NOT NULL,
  prediction jsonb NOT NULL, -- Store prediction results
  confidence_score numeric, -- 0-100
  created_at timestamptz DEFAULT now()
);

-- ML Training Logs
CREATE TABLE ml_training_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ml_models(id),
  training_status text, -- 'started', 'completed', 'failed'
  data_points_used integer,
  training_duration_ms integer,
  accuracy_metrics jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);
```

---

## 🔄 Auto-Learning Workflow

### 1. Data Collection Phase (Current)
- **Status:** ✅ Active
- **What:** Collect all user interactions, property data, buyer intelligence
- **Where:** `properties`, `inquiries`, `property_views`, `profiles` tables
- **No ML yet** - just data collection

### 2. Data Monitoring Phase
- **Automated Job:** Check daily if enough data for each model
- **Query:** Count properties, inquiries, views, time span
- **Compare:** Against `ml_models.minimum_data_points`
- **Action:** Mark model as "ready_for_training" when threshold met

### 3. Training Phase
- **Trigger:** When model status changes to "ready_for_training"
- **Process:**
  1. Extract features from database
  2. Prepare training dataset
  3. Train model (Python script/API)
  4. Validate accuracy
  5. Store model artifacts
  6. Update `ml_models` table with status = "active"

### 4. Prediction Phase
- **When:** Model status = "active"
- **How:** 
  - API endpoint for predictions
  - Background jobs for batch predictions
  - Store results in `ml_predictions` table
- **Usage:** Display in dashboard, use for recommendations

### 5. Continuous Learning
- **Schedule:** Retrain monthly/weekly when new data arrives
- **Compare:** New model accuracy vs. current
- **Update:** If new model is better, replace current
- **Version:** Increment model version

---

## 💻 Implementation Plan

### Phase 1: Foundation (Now)
✅ **Create Database Tables**
- `ml_models` table
- `ml_predictions` table
- `ml_training_logs` table

✅ **Data Monitoring System**
- Function to check data counts
- Update `ml_models.current_data_points` daily
- Auto-update model status to "ready_for_training"

✅ **Dashboard Display**
- Show ML models status (pending/ready/active)
- Display data thresholds progress
- Show when models will activate

---

### Phase 2: First Model - Price Prediction (50+ properties)
**Timeline:** When you reach 50 properties

**Implementation:**
1. **Python ML Service** (separate microservice)
   - Endpoint: `/api/ml/train/price-predictor`
   - Endpoint: `/api/ml/predict/price`
   - Uses libraries: `scikit-learn`, `pandas`, `numpy`

2. **Training Script:**
   ```python
   # Fetch data from Supabase
   # Prepare features: district, type, plot_size, bedrooms, bathrooms
   # Train regression model (Random Forest or Linear Regression)
   # Calculate accuracy metrics (MAE, R²)
   # Save model to file storage
   # Return model metadata
   ```

3. **Integration:**
   - Supabase Edge Function or Next.js API route
   - Calls Python service for training
   - Stores results in `ml_models` table
   - Makes predictions via API

---

### Phase 3: Demand Forecasting (200+ properties)
**Timeline:** When you reach 200 properties

**Similar approach:**
- Classification model (will get inquiries: yes/no)
- Probability score for each property
- Update daily with new data

---

### Phase 4: Buyer Matching (500+ properties)
**Timeline:** When you reach 500 properties

**Advanced:**
- Collaborative filtering
- Content-based recommendations
- Hybrid approach

---

## 🔧 Technical Stack

### ML Service Options

**Option 1: Python Microservice**
- Flask/FastAPI
- Deploy on Railway/Render/Vercel
- Separate from Next.js app

**Option 2: Supabase Edge Functions**
- Deno runtime
- Simpler deployment
- Limited ML libraries

**Option 3: Hybrid**
- Python for training (heavy computation)
- Edge Functions for predictions (fast, serverless)
- Store model artifacts in Supabase Storage

**Recommended:** Option 1 (Python Microservice)

---

## 📈 Activation Timeline

### Current Status: Data Collection Phase
- **Properties:** 0 (growing)
- **Inquiries:** 0 (growing)
- **ML Status:** Not yet active

### Expected Milestones

**Month 1-3:**
- Collect initial data
- **Price Predictor:** Ready when 50 properties reached
- Show progress in dashboard

**Month 4-6:**
- **Price Predictor:** Active (50+ properties)
- **Demand Forecast:** Ready when 200 properties reached

**Month 7-12:**
- **Demand Forecast:** Active (200+ properties)
- **Buyer Matching:** Ready when 500 properties reached

**Year 2+:**
- **Buyer Matching:** Active (500+ properties)
- **Trend Prediction:** Ready when 12 months data available

---

## 🎯 Dashboard Integration

### ML Status Panel (Add to Admin Dashboard)
```
┌─────────────────────────────────────┐
│ 🤖 ML Models Status                 │
├─────────────────────────────────────┤
│ Price Predictor                     │
│ • Status: Pending                   │
│ • Progress: 15/50 properties (30%)  │
│ • Estimated: 2-3 weeks              │
│                                     │
│ Demand Forecast                     │
│ • Status: Pending                   │
│ • Progress: 15/200 properties (8%)  │
│ • Estimated: 3-4 months             │
└─────────────────────────────────────┘
```

### When Models Are Active
- Show predictions in property cards
- Display "Likely to get inquiries: 85%"
- Show price range predictions
- Recommend properties to buyers

---

## 🚀 Next Steps

### Immediate (Now)
1. ✅ Create database tables for ML
2. ✅ Add data monitoring queries
3. ✅ Display ML status in dashboard
4. ✅ Track progress toward thresholds

### Short Term (When Data Grows)
1. Set up Python ML service
2. Implement price prediction model
3. Create training pipeline
4. Integrate predictions into UI

### Long Term (As Data Matures)
1. Add more sophisticated models
2. Implement continuous learning
3. A/B test model improvements
4. Build recommendation engine

---

## 📝 Key Principles

1. **Data First:** Collect rich data before building models
2. **Start Simple:** Begin with basic models, improve over time
3. **Auto-Activate:** Models turn on automatically when ready
4. **Continuous Learning:** Retrain regularly with new data
5. **Transparency:** Show model status and accuracy to admins
6. **Graceful Degradation:** Work without ML, enhance with ML
7. **Smart Data Mining:** ML guides what data to collect and identifies gaps

---

## 🔍 **ML Data Mining Enhancement**

**In addition to traditional ML features**, the system includes **data mining intelligence models** that enhance your data collection strategy:

### **Phase 5+: Data Mining ML Models**

See `ML_DATA_MINING_ENHANCEMENT.md` for details on:
- **Data Quality Model:** Identifies data gaps and prioritizes collection
- **Data Value Model:** Ranks data by importance for insights
- **Anomaly Detection:** Identifies unusual patterns and opportunities
- **Market Intelligence Gap Analysis:** Finds missing market data
- **Predictive Data Collection:** Optimizes what to collect and when

**These models help you:**
- ✅ Collect data that provides most value
- ✅ Identify gaps in market intelligence
- ✅ Optimize data collection forms and questions
- ✅ Focus on high-value data sources
- ✅ Detect emerging trends and anomalies

**Result:** ML enhances both platform experience AND data mining efficiency.

---

**Your ML system will grow and activate automatically as your data grows! 🚀**

