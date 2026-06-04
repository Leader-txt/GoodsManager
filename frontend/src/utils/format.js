/**
 * 格式化价格 (¥X,XXX.XX)
 */
export function formatPrice(price) {
  if (price == null) return '¥0.00';
  return '¥' + Number(price).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 格式化日期时间
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 格式化日期 (不含时间)
 */
export function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 订单状态映射
 */
export const ORDER_STATUS_MAP = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已出库',
  delivering: '配送中',
  signed: '已签收',
  cancelled: '已取消',
};

export function getOrderStatusText(status) {
  return ORDER_STATUS_MAP[status] || status;
}

export function getOrderStatusColor(status) {
  const colors = {
    pending: '#faad14',
    paid: '#1890ff',
    shipped: '#722ed1',
    delivering: '#13c2c2',
    signed: '#52c41a',
    cancelled: '#999',
  };
  return colors[status] || '#999';
}
