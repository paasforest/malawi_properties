# Plot Intelligence SQL Queries

## Ready-to-Use SQL for Plot Analysis

Copy and paste these queries into Supabase SQL Editor or use in your dashboard.

---

## 1. 📊 Average Price Per Plot by District & Plot Size Category

```sql
-- Price per plot analysis (Malawi market style)
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
  ROUND(AVG(price)) as avg_price_per_plot,
  MIN(price) as min_price_per_plot,
  MAX(price) as max_price_per_plot,
  ROUND(AVG(plot_size)) as avg_size_sqm,
  -- Internal analysis: price per sqm (for intelligence only)
  ROUND(AVG(price / NULLIF(plot_size, 0))) as avg_price_per_sqm,
  -- Demand metrics
  AVG(views_count) as avg_views,
  AVG(inquiries_count) as avg_inquiries,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_count
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND plot_size > 0
GROUP BY district, plot_category
ORDER BY district, avg_price_per_plot DESC;
```

---

## 2. 📐 Most Common Plot Sizes by District

```sql
-- Identify standard plot sizes per district
SELECT 
  district,
  plot_size as sqm,
  COUNT(*) as frequency,
  ROUND(AVG(price)) as avg_price_per_plot,
  ROUND(AVG(price / NULLIF(plot_size, 0))) as avg_price_per_sqm,
  ROUND(AVG(inquiries_count), 1) as avg_inquiries,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_count,
  -- Common dimension approximations
  CASE 
    WHEN plot_size BETWEEN 395 AND 405 THEN '~20m × 20m'
    WHEN plot_size BETWEEN 440 AND 460 THEN '~20m × 22.5m or 25m × 18m'
    WHEN plot_size BETWEEN 620 AND 630 THEN '~25m × 25m'
    WHEN plot_size BETWEEN 745 AND 755 THEN '~25m × 30m'
    WHEN plot_size BETWEEN 870 AND 880 THEN '~25m × 35m'
    WHEN plot_size BETWEEN 895 AND 905 THEN '~30m × 30m'
    WHEN plot_size BETWEEN 1195 AND 1205 THEN '~30m × 40m'
    ELSE 'Custom dimensions'
  END as approximate_dimensions
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND plot_size > 0
GROUP BY district, plot_size
HAVING COUNT(*) >= 2  -- Only show plot sizes with 2+ listings
ORDER BY district, frequency DESC, avg_price_per_plot DESC;
```

---

## 3. 💰 Price Range Analysis by Plot Size

```sql
-- Price distribution by plot size category
SELECT 
  CASE 
    WHEN plot_size < 400 THEN 'Small (<400sqm)'
    WHEN plot_size BETWEEN 400 AND 500 THEN 'Standard (400-500sqm)'
    WHEN plot_size BETWEEN 500 AND 700 THEN 'Medium (500-700sqm)'
    WHEN plot_size BETWEEN 700 AND 1000 THEN 'Large (700-1000sqm)'
    WHEN plot_size > 1000 THEN 'Extra Large (>1000sqm)'
  END as plot_category,
  currency,
  COUNT(*) as total_plots,
  ROUND(AVG(price)) as avg_price_per_plot,
  ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price)) as q1_price,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)) as median_price,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price)) as q3_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND plot_size > 0
  AND status IN ('available', 'sold')
GROUP BY plot_category, currency
ORDER BY plot_category, avg_price_per_plot DESC;
```

---

## 4. 🌍 Diaspora Plot Size Preferences

```sql
-- Which plot sizes do diaspora buyers prefer?
SELECT 
  pr.current_location as diaspora_location,
  CASE 
    WHEN p.plot_size < 400 THEN 'Small (<400sqm)'
    WHEN p.plot_size BETWEEN 400 AND 500 THEN 'Standard (400-500sqm)'
    WHEN p.plot_size BETWEEN 500 AND 700 THEN 'Medium (500-700sqm)'
    WHEN p.plot_size > 700 THEN 'Large (>700sqm)'
  END as plot_category,
  COUNT(DISTINCT i.id) as inquiry_count,
  ROUND(AVG(p.price)) as avg_price_per_plot,
  ROUND(AVG(p.plot_size)) as avg_plot_size,
  ROUND(AVG(CASE 
    WHEN i.budget_range ~ '^\d+.*\d+$' 
    THEN CAST(SPLIT_PART(i.budget_range, '-', 1) AS NUMERIC) 
    ELSE NULL END)) as avg_budget_low,
  -- Intended use breakdown
  COUNT(CASE WHEN i.intended_use = 'Home Build' THEN 1 END) as home_build_count,
  COUNT(CASE WHEN i.intended_use = 'Rental Income' THEN 1 END) as rental_count,
  COUNT(CASE WHEN i.intended_use = 'Farming' THEN 1 END) as farming_count
FROM inquiries i
JOIN properties p ON i.property_id = p.id
JOIN profiles pr ON i.buyer_id = pr.id
WHERE pr.is_diaspora = true
  AND p.property_type = 'land'
  AND p.plot_size IS NOT NULL
  AND p.plot_size > 0
GROUP BY pr.current_location, plot_category
ORDER BY pr.current_location, inquiry_count DESC;
```

---

## 5. 📈 Plot Size vs Demand (Hot vs Cold)

```sql
-- Which plot sizes are in highest demand?
SELECT 
  CASE 
    WHEN plot_size < 400 THEN 'Small (<400sqm)'
    WHEN plot_size BETWEEN 400 AND 500 THEN 'Standard (400-500sqm)'
    WHEN plot_size BETWEEN 500 AND 700 THEN 'Medium (500-700sqm)'
    WHEN plot_size BETWEEN 700 AND 1000 THEN 'Large (700-1000sqm)'
    WHEN plot_size > 1000 THEN 'Extra Large (>1000sqm)'
  END as plot_category,
  COUNT(DISTINCT p.id) as total_listings,
  SUM(p.views_count) as total_views,
  SUM(p.inquiries_count) as total_inquiries,
  COUNT(CASE WHEN p.status = 'sold' THEN 1 END) as sold_count,
  -- Demand score: inquiries per listing
  ROUND(AVG(p.inquiries_count::numeric / NULLIF(p.views_count, 0)) * 100, 2) as inquiry_rate,
  -- Conversion rate
  ROUND(
    COUNT(CASE WHEN p.status = 'sold' THEN 1 END)::numeric / 
    NULLIF(COUNT(DISTINCT p.id), 0) * 100, 
    2
  ) as conversion_rate,
  -- Average time to sale (days)
  ROUND(AVG(
    CASE WHEN p.status = 'sold' AND p.sold_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (p.sold_at - p.listed_at)) / 86400
    ELSE NULL END
  )) as avg_days_to_sale
FROM properties p
WHERE p.property_type = 'land'
  AND p.plot_size IS NOT NULL
  AND p.plot_size > 0
GROUP BY plot_category
ORDER BY total_inquiries DESC;
```

---

## 6. 🏘️ District Plot Profile (Urban vs Peri-Urban)

```sql
-- Urban vs Peri-Urban plot characteristics
SELECT 
  district,
  COUNT(*) as total_plots,
  ROUND(AVG(plot_size)) as avg_plot_size,
  MIN(plot_size) as min_plot_size,
  MAX(plot_size) as max_plot_size,
  ROUND(AVG(price)) as avg_price_per_plot,
  -- Categorize as Urban vs Peri-Urban based on plot size
  CASE 
    WHEN AVG(plot_size) < 500 THEN 'Urban (Smaller plots)'
    WHEN AVG(plot_size) BETWEEN 500 AND 800 THEN 'Mixed'
    ELSE 'Peri-Urban (Larger plots)'
  END as area_type,
  -- Standard plot size indicator
  CASE 
    WHEN COUNT(CASE WHEN plot_size BETWEEN 440 AND 460 THEN 1 END) > COUNT(*) * 0.3 
    THEN 'Standard 450sqm plots common'
    WHEN COUNT(CASE WHEN plot_size BETWEEN 870 AND 880 THEN 1 END) > COUNT(*) * 0.3
    THEN 'Standard 875sqm plots common'
    ELSE 'Mixed plot sizes'
  END as standard_size_note
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND plot_size > 0
GROUP BY district
ORDER BY avg_price_per_plot DESC;
```

---

## 7. 💡 Value Analysis (Price Efficiency)

```sql
-- Identify value opportunities (low price per sqm within plot category)
SELECT 
  p.id,
  p.title,
  p.district,
  p.plot_size as sqm,
  p.price as price_per_plot,
  ROUND(p.price / NULLIF(p.plot_size, 0)) as price_per_sqm,
  -- Compare to district average
  ROUND(
    p.price / NULLIF(p.plot_size, 0) - 
    (SELECT AVG(price / NULLIF(plot_size, 0)) 
     FROM properties 
     WHERE district = p.district 
       AND property_type = 'land' 
       AND plot_size > 0
       AND status = p.status)
  ) as price_diff_from_avg,
  CASE 
    WHEN p.price / NULLIF(p.plot_size, 0) < 
      (SELECT AVG(price / NULLIF(plot_size, 0)) * 0.9
       FROM properties 
       WHERE district = p.district 
         AND property_type = 'land' 
         AND plot_size > 0)
    THEN 'Below Market (Good Value)'
    WHEN p.price / NULLIF(p.plot_size, 0) > 
      (SELECT AVG(price / NULLIF(plot_size, 0)) * 1.1
       FROM properties 
       WHERE district = p.district 
         AND property_type = 'land' 
         AND plot_size > 0)
    THEN 'Above Market (Premium)'
    ELSE 'Market Rate'
  END as value_category,
  p.views_count,
  p.inquiries_count,
  p.status
FROM properties p
WHERE p.property_type = 'land'
  AND p.plot_size IS NOT NULL
  AND p.plot_size > 0
  AND p.status = 'available'
ORDER BY price_per_sqm ASC
LIMIT 20;  -- Top 20 value opportunities
```

---

## 8. 📅 Plot Size Trends Over Time

```sql
-- How are plot sizes and prices changing?
SELECT 
  DATE_TRUNC('month', created_at) as month,
  CASE 
    WHEN plot_size < 400 THEN 'Small'
    WHEN plot_size BETWEEN 400 AND 500 THEN 'Standard'
    WHEN plot_size BETWEEN 500 AND 700 THEN 'Medium'
    WHEN plot_size > 700 THEN 'Large'
  END as plot_category,
  COUNT(*) as listings,
  ROUND(AVG(price)) as avg_price_per_plot,
  ROUND(AVG(plot_size)) as avg_size,
  ROUND(AVG(price / NULLIF(plot_size, 0))) as avg_price_per_sqm,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_count
FROM properties
WHERE property_type = 'land'
  AND plot_size IS NOT NULL
  AND plot_size > 0
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY month, plot_category
ORDER BY month DESC, plot_category;
```

---

## 9. 🎯 Summary: Plot Intelligence Dashboard Query

```sql
-- Comprehensive plot intelligence summary
SELECT 
  -- Overall stats
  (SELECT COUNT(*) FROM properties WHERE property_type = 'land' AND plot_size IS NOT NULL) as total_land_listings,
  (SELECT ROUND(AVG(price)) FROM properties WHERE property_type = 'land' AND plot_size IS NOT NULL AND status = 'sold') as avg_sold_price,
  
  -- Most common plot size
  (SELECT plot_size FROM properties 
   WHERE property_type = 'land' AND plot_size IS NOT NULL 
   GROUP BY plot_size 
   ORDER BY COUNT(*) DESC 
   LIMIT 1) as most_common_plot_size,
   
  -- Price range
  (SELECT MIN(price) FROM properties WHERE property_type = 'land' AND plot_size IS NOT NULL) as min_plot_price,
  (SELECT MAX(price) FROM properties WHERE property_type = 'land' AND plot_size IS NOT NULL) as max_plot_price,
  
  -- Average plot size
  (SELECT ROUND(AVG(plot_size)) FROM properties WHERE property_type = 'land' AND plot_size IS NOT NULL) as avg_plot_size_sqm,
  
  -- Demand metrics
  (SELECT ROUND(AVG(inquiries_count)) FROM properties WHERE property_type = 'land' AND plot_size IS NOT NULL) as avg_inquiries_per_plot,
  
  -- Top district by volume
  (SELECT district FROM properties 
   WHERE property_type = 'land' AND plot_size IS NOT NULL
   GROUP BY district 
   ORDER BY COUNT(*) DESC 
   LIMIT 1) as top_district_by_volume;
```

---

## 🎯 Usage Tips

1. **Price Per Plot** - Always show this to users (not price per sqm)
2. **Price Per SQM** - Calculate internally for value analysis, market intelligence
3. **Plot Categories** - Group similar sizes together for analysis
4. **Standard Dimensions** - Approximate dimensions based on common plot sizes
5. **Demand Metrics** - Combine plot size with inquiry/views to see demand

---

**Use these queries in your admin dashboard to power plot intelligence! 📊**




