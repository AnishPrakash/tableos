/**
 * Erlang-C Queue Model for restaurant wait time prediction
 * Used to estimate realistic customer wait times based on
 * current queue depth, available tables, and service rate.
 */

interface ErlangCResult {
  estimatedWaitMinutes: number
  probability_wait: number
  utilization: number
  recommended_action: string
}

/**
 * Factorial — capped at 170 to avoid Infinity
 */
function factorial(n: number): number {
  if (n <= 1) return 1
  if (n > 170) return Infinity
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

/**
 * Core Erlang C formula
 * @param A - Total traffic intensity (arrival_rate / service_rate)
 * @param c - Number of servers (available tables/servers)
 */
function erlangC(A: number, c: number): number {
  if (c <= 0) return 1
  const rho = A / c
  if (rho >= 1) return 1 // System is overloaded

  const Ac = Math.pow(A, c)
  const cFactorial = factorial(c)
  const numerator = (Ac / cFactorial) * (c / (c - A))

  let denominator = numerator
  for (let k = 0; k < c; k++) {
    denominator += Math.pow(A, k) / factorial(k)
  }

  return numerator / denominator
}

/**
 * Compute estimated wait time for a customer joining the queue
 * @param queue_length - Number of parties currently waiting
 * @param available_tables - Tables currently free
 * @param avg_meal_duration_minutes - Average time a party occupies a table
 * @param party_size - Size of the incoming party
 * @param total_tables - Total tables in restaurant
 */
export function computeQueueWait(
  queue_length: number,
  available_tables: number,
  avg_meal_duration_minutes: number = 45,
  party_size: number = 2,
  total_tables: number = 10
): ErlangCResult {
  const avg_service_rate = 1 / avg_meal_duration_minutes // tables freed per minute
  const arrival_rate = queue_length > 0 ? (queue_length / avg_meal_duration_minutes) : 0.1

  const traffic_intensity = arrival_rate / avg_service_rate
  const c = Math.max(1, available_tables + 1)

  const Pc = erlangC(traffic_intensity, c)
  const utilization = traffic_intensity / c

  let estimatedWaitMinutes: number

  if (available_tables > 0 && queue_length === 0) {
    estimatedWaitMinutes = 0
  } else if (available_tables > 0) {
    estimatedWaitMinutes = Math.ceil(5 + (queue_length * 3))
  } else {
    // Full house — use Erlang formula
    const occupied_tables = total_tables - available_tables
    const avg_remaining = avg_meal_duration_minutes * (1 - (occupied_tables / total_tables))
    estimatedWaitMinutes = Math.ceil(Pc * avg_remaining + (queue_length * 5))
  }

  // Cap at reasonable bounds
  estimatedWaitMinutes = Math.min(Math.max(estimatedWaitMinutes, 0), 120)

  let recommended_action = 'Join queue'
  if (estimatedWaitMinutes === 0) recommended_action = 'Seat immediately'
  else if (estimatedWaitMinutes < 15) recommended_action = 'Short wait — recommend joining'
  else if (estimatedWaitMinutes < 30) recommended_action = 'Moderate wait — offer buzzer notification'
  else recommended_action = 'Long wait — recommend pre-ordering or coming back'

  return {
    estimatedWaitMinutes,
    probability_wait: parseFloat(Pc.toFixed(3)),
    utilization: parseFloat(utilization.toFixed(3)),
    recommended_action,
  }
}