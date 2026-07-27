/**
 * Dynamic Pricing Engine
 * Adjusts menu item prices based on demand surge,
 * time of day, and inventory levels.
 */

interface PricingFactors {
  base_price: number
  current_orders_last_hour: number
  avg_orders_per_hour: number
  inventory_level: 'high' | 'medium' | 'low' | 'critical'
  hour_of_day: number // 0-23
  day_of_week: number // 0=Sunday, 6=Saturday
}

interface PricingResult {
  new_price: number
  price_change_percent: number
  reason: string
  strategy: string
}

export function computeDynamicPrice(factors: PricingFactors): PricingResult {
  let multiplier = 1.0
  const reasons: string[] = []

  // 1. Demand Surge Pricing (±20%)
  if (factors.avg_orders_per_hour > 0) {
    const demand_ratio = factors.current_orders_last_hour / factors.avg_orders_per_hour
    if (demand_ratio > 1.5) {
      multiplier += 0.15
      reasons.push('High demand surge (+15%)')
    } else if (demand_ratio > 2.0) {
      multiplier += 0.20
      reasons.push('Peak demand surge (+20%)')
    } else if (demand_ratio < 0.5) {
      multiplier -= 0.10
      reasons.push('Low demand discount (-10%)')
    }
  }

  // 2. Peak Hour Pricing
  const isPeakLunch = factors.hour_of_day >= 12 && factors.hour_of_day <= 14
  const isPeakDinner = factors.hour_of_day >= 19 && factors.hour_of_day <= 21
  const isWeekend = factors.day_of_week === 0 || factors.day_of_week === 6

  if (isPeakLunch || isPeakDinner) {
    multiplier += 0.08
    reasons.push('Peak dining hours (+8%)')
  }
  if (isWeekend) {
    multiplier += 0.05
    reasons.push('Weekend premium (+5%)')
  }

  // 3. Inventory Liquidation Discount
  if (factors.inventory_level === 'critical') {
    multiplier -= 0.20
    reasons.push('Inventory clearance (-20%)')
  } else if (factors.inventory_level === 'low') {
    multiplier -= 0.10
    reasons.push('Stock discount (-10%)')
  } else if (factors.inventory_level === 'high') {
    multiplier += 0.05
    reasons.push('Fresh stock premium (+5%)')
  }

  // 4. Off-peak Promotion (late evening)
  const isOffPeak = factors.hour_of_day >= 15 && factors.hour_of_day <= 17
  if (isOffPeak) {
    multiplier -= 0.05
    reasons.push('Happy hour discount (-5%)')
  }

  // Cap multiplier between 0.7 and 1.35 (never gouge or sell at loss)
  multiplier = Math.min(Math.max(multiplier, 0.70), 1.35)

  const new_price = Math.round(factors.base_price * multiplier * 100) / 100
  const price_change_percent = Math.round((multiplier - 1) * 100)

  return {
    new_price,
    price_change_percent,
    reason: reasons.join('; ') || 'Standard pricing',
    strategy: multiplier > 1 ? 'surge' : multiplier < 1 ? 'discount' : 'standard',
  }
}

export function getInventoryLevel(current: number, threshold: number): 'high' | 'medium' | 'low' | 'critical' {
  const ratio = current / threshold
  if (ratio > 3) return 'high'
  if (ratio > 1.5) return 'medium'
  if (ratio > 0.5) return 'low'
  return 'critical'
}