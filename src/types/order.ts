export const ORDER_STATUS = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const

export type OrderStatus = (typeof ORDER_STATUS)[number]

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[current].includes(next)
}
