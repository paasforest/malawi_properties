# 🇲🇼 Malawi Plot Intelligence - Data Mining Strategy

## Understanding Malawi Land Market

Based on research:
- **Plots sold by dimensions**: 25m × 35m, 20m × 20m, 30m × 30m, etc.
- **Standard urban plots**: ~450 sqm (commonly 20m × 22.5m or 25m × 18m)
- **Peri-urban plots**: Larger, lower price per plot
- **Price is per complete plot**, not per square meter
- **Common plot sizes vary by district**: Urban areas smaller, peri-urban larger

---

## 📊 What Data to Mine (Plot-Based)

### 1. 💰 Price Per Plot Analysis (Not Per SQM)

**Key Metrics:**
- **Average Price Per Plot** by district
- **Average Price Per Plot** by common plot size categories
- **Price Range Distribution** by plot size
- **Currency Preferences** by plot size (MWK vs USD vs ZAR)

**Common Plot Size Categories:**
```
Small Plots:  < 400 sqm (e.g., 20m × 20m = 400 sqm)
Standard:     400-500 sqm (e.g., 25m × 18m = 450 sqm, 20m × 22.5m = 450 sqm)
Medium:       500-700 sqm (e.g., 25m × 25m = 625 sqm, 25m × 35m = 875 sqm)
Large:        700-1000 sqm
Extra Large:  > 1000 sqm
```

**SQL Query:**
```sql
-- Price per plot analysis by plot size category
SELECT 
  district,
  CASE 
    WHEN plot_size < 400 THEN 'Small (<400sqm)'
    WHEN plot_size BETWEEN 400 AND 500 THEN 'Standard (400-500sqm)'
    WHEN plot_size BETWEEN 500 AND 700 THEN 'Medium (500-700sqm)'
    WHEN plot_size BETWEEN 700 AND 1000 THEN 'Large (700-1000sqm)'
    WHEN plot_size > 1000 THEN 'Extra Large (>1000sqm)'
    ELSE 'Not Specified'
  END as plot_category,
  COUNT(*) as plot_count,
  AVG(price) as avg_price_per_plot,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(plot_size) as avg_size_sqm
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND plot_size > 0
GROUP BY district, plot_category
ORDER BY district, avg_price_per_plot DESC;
```

---

### 2. 📐 Common Plot Dimensions Analysis

**What to Track:**
- Most common plot sizes by district (450sqm, 625sqm, 875sqm, etc.)
- Price correlation with plot size (is bigger always more expensive?)
- Plot size preferences by buyer type (diaspora vs local)
- Plot size trends over time

**Common Plot Dimensions in Malawi:**
```
20m × 20m = 400 sqm
20m × 22.5m = 450 sqm (standard urban)
25m × 18m = 450 sqm (standard urban)
25m × 25m = 625 sqm
25m × 30m = 750 sqm
25m × 35m = 875 sqm
30m × 30m = 900 sqm
30m × 40m = 1200 sqm
```

**SQL Query:**
```sql
-- Most common plot sizes by district
SELECT 
  district,
  plot_size,
  COUNT(*) as frequency,
  AVG(price) as avg_price,
  ROUND(AVG(price / NULLIF(plot_size, 0)), 2) as avg_price_per_sqm
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND plot_size > 0
GROUP BY district, plot_size
HAVING COUNT(*) >= 2  -- Only show plot sizes with 2+ listings
ORDER BY district, frequency DESC;
```

**Value:** Identifies standard plot sizes per district, helps buyers know what's typical.

---

### 3. 🏘️ Plot Size Distribution by District

**What to Analyze:**
- Urban districts: Smaller plots (400-500 sqm standard)
- Peri-urban districts: Larger plots (700-1000+ sqm)
- Price per plot by district vs plot size
- Demand for different plot sizes

**SQL Query:**
```sql
-- Plot size distribution and pricing by district
SELECT 
  district,
  AVG(plot_size) as avg_plot_size,
  MIN(plot_size) as min_plot_size,
  MAX(plot_size) as max_plot_size,
  AVG(price) as avg_price_per_plot,
  COUNT(*) as total_plots,
  AVG(views_count) as avg_views,
  AVG(inquiries_count) as avg_inquiries,
  ROUND(AVG(inquiries_count::numeric / NULLIF(views_count, 0)) * 100, 2) as inquiry_rate
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
GROUP BY district
ORDER BY avg_price_per_plot DESC;
```

**Value:** Shows which districts have larger/smaller plots and how pricing varies.

---

### 4. 💵 Price Premium Analysis

**What to Mine:**
- Does plot size affect price per plot? (non-linear pricing)
- Do standard sizes (450 sqm) command premium?
- Price per plot vs price per sqm comparison (for internal analysis)
- Urgent sale impact on plot prices

**Key Insight:**
Even though prices are per plot, calculating price per sqm internally helps identify:
- Undervalued plots (low price per sqm)
- Overpriced plots (high price per sqm)
- Market inefficiencies

**SQL Query:**
```sql
-- Price per sqm (internal analysis) vs price per plot
SELECT 
  district,
  plot_size,
  price as price_per_plot,
  ROUND(price / NULLIF(plot_size, 0), 2) as price_per_sqm,
  CASE 
    WHEN price / NULLIF(plot_size, 0) < 
      (SELECT AVG(price / NULLIF(plot_size, 0)) FROM properties 
       WHERE district = p.district AND property_type = 'land' AND plot_size > 0)
    THEN 'Below Average'
    ELSE 'Above Average'
  END as pricing_category
FROM properties p
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND plot_size > 0
ORDER BY price_per_sqm DESC;
```

---

### 5. 🌍 Diaspora Plot Preferences

**What to Analyze:**
- Preferred plot sizes by diaspora location (SA, UK, USA buyers)
- Budget allocation to plot size
- Plot size vs intended use (home build, rental, farming)
- Currency used by plot size

**SQL Query:**
```sql
-- Diaspora buyer plot size preferences
SELECT 
  pr.current_location as diaspora_location,
  CASE 
    WHEN p.plot_size < 400 THEN 'Small (<400sqm)'
    WHEN p.plot_size BETWEEN 400 AND 500 THEN 'Standard (400-500sqm)'
    WHEN p.plot_size BETWEEN 500 AND 700 THEN 'Medium (500-700sqm)'
    WHEN p.plot_size > 700 THEN 'Large (>700sqm)'
    ELSE 'Not Specified'
  END as plot_category,
  COUNT(DISTINCT i.id) as inquiry_count,
  AVG(p.price) as avg_price_per_plot,
  AVG(CAST(i.budget_range AS NUMERIC)) as avg_budget
FROM inquiries i
JOIN properties p ON i.property_id = p.id
JOIN profiles pr ON i.buyer_id = pr.id
WHERE pr.is_diaspora = true
  AND p.property_type = 'land'
  AND p.plot_size IS NOT NULL
GROUP BY pr.current_location, plot_category
ORDER BY pr.current_location, inquiry_count DESC;
```

**Value:** UNIQUE intelligence - which diaspora communities prefer which plot sizes.

---

### 6. 📈 Plot Size Trends Over Time

**What to Track:**
- Are plot sizes getting smaller or larger over time?
- Price trends for specific plot sizes
- Supply of different plot sizes
- Demand shifts for different sizes

**SQL Query:**
```sql
-- Plot size trends by month
SELECT 
  DATE_TRUNC('month', created_at) as month,
  CASE 
    WHEN plot_size < 400 THEN 'Small'
    WHEN plot_size BETWEEN 400 AND 500 THEN 'Standard'
    WHEN plot_size BETWEEN 500 AND 700 THEN 'Medium'
    WHEN plot_size > 700 THEN 'Large'
  END as plot_category,
  COUNT(*) as listings,
  AVG(price) as avg_price
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY month, plot_category
ORDER BY month DESC, plot_category;
```

---

## 🎯 Dashboard Enhancements for Plot Intelligence

### Add These Metrics to Admin Dashboard:

1. **Plot Size Distribution**
   - Pie chart showing: Small, Standard, Medium, Large plots
   - Bar chart showing distribution by district

2. **Average Price Per Plot**
   - By district
   - By plot size category
   - By currency

3. **Common Plot Sizes**
   - Most popular plot sizes (450sqm, 625sqm, 875sqm, etc.)
   - Show with dimensions (e.g., "450 sqm (20m × 22.5m)")

4. **Plot Size vs Demand**
   - Which plot sizes get most inquiries?
   - Which plot sizes sell fastest?
   - View-to-inquiry ratio by plot size

5. **Diaspora Plot Preferences**
   - Bar chart: Preferred plot sizes by diaspora location
   - Table: SA buyers prefer X sqm, UK buyers prefer Y sqm

6. **Price Per Plot Trends**
   - Line chart: Price per plot over time
   - By district, by plot size category

---

## 💡 Key Insights to Generate

### 1. **Standard Plot Sizes Per District**
- "In Lilongwe Area 43, standard plots are 450 sqm (20m × 22.5m) averaging MWK 30M"
- "In peri-urban areas, standard plots are 875 sqm (25m × 35m) averaging MWK 5M"

### 2. **Price Efficiency Analysis**
- "Plots 500-700 sqm offer best value (price per sqm)"
- "Standard 450 sqm plots command premium due to high demand"

### 3. **Diaspora Targeting**
- "UK diaspora buyers prefer 625-875 sqm plots for home builds"
- "SA diaspora buyers prefer standard 450 sqm plots in urban areas"

### 4. **Market Gaps**
- "High demand for 400-500 sqm plots but low supply in Area 44"
- "Large plots (>1000 sqm) available but low demand"

---

## 🚀 Implementation Priority

### Phase 1: Basic Plot Intelligence (This Week)
- [ ] Add plot size categories to dashboard
- [ ] Display average price per plot (not per sqm) by district
- [ ] Show most common plot sizes

### Phase 2: Advanced Analysis (This Month)
- [ ] Plot size vs demand analysis
- [ ] Diaspora plot preferences
- [ ] Price per sqm (internal) vs price per plot comparison

### Phase 3: Trends & Predictions (This Quarter)
- [ ] Plot size trends over time
- [ ] Price trend by plot size
- [ ] Demand forecasting by plot size

---

## 📐 Plot Dimension Helpers

### Common Plot Dimensions Reference:

```javascript
// Helper function to calculate plot dimensions from sqm
const COMMON_PLOT_DIMENSIONS = {
  400: { length: 20, width: 20 },
  450: { length: 20, width: 22.5 }, // OR 25 × 18
  625: { length: 25, width: 25 },
  750: { length: 25, width: 30 },
  875: { length: 25, width: 35 },
  900: { length: 30, width: 30 },
  1200: { length: 30, width: 40 }
};

// Helper to categorize plot size
function categorizePlotSize(sqm) {
  if (sqm < 400) return 'Small (<400sqm)';
  if (sqm >= 400 && sqm <= 500) return 'Standard (400-500sqm)';
  if (sqm > 500 && sqm <= 700) return 'Medium (500-700sqm)';
  if (sqm > 700 && sqm <= 1000) return 'Large (700-1000sqm)';
  return 'Extra Large (>1000sqm)';
}
```

---

## 🎯 Key Takeaway

**Focus on:**
1. ✅ **Price per plot** (not per sqm) - this is what buyers care about
2. ✅ **Plot size categories** (Small, Standard, Medium, Large)
3. ✅ **Common plot dimensions** (450sqm = standard urban)
4. ✅ **Plot size preferences** by buyer type, district, diaspora location
5. ✅ **Price per sqm as internal metric** (for identifying value, not displayed)

**Display to users:** "MWK 30M for a 450 sqm plot (25m × 18m)"  
**Internal analysis:** Calculate price per sqm for market intelligence, but show price per plot.

---

**This aligns with how the Malawian market actually works! 🇲🇼**




