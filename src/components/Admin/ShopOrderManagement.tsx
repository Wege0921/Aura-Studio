import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ShopOrder, formatETB, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_COLORS } from '../Shop/shopTypes';
import { XMarkIcon, EyeIcon, CheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ShopOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editTracking, setEditTracking] = useState({ carrier: '', trackingNumber: '', shippingCost: '', notes: '' });
  const ITEMS_PER_PAGE = 10;

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const data = await api.get<{ orders: ShopOrder[] }>(`/api/admin/shop/orders?${params.toString()}`);
      setOrders(data.orders || []);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await api.patch(`/api/admin/shop/orders/${orderId}/status`, { status });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      fetchOrders();
    } catch (err: any) { setError(err.message); }
  };

  const handlePaymentVerify = async (orderId: string, paymentStatus: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.patch(`/api/admin/shop/orders/${orderId}/payment`, { paymentStatus });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus, status: paymentStatus === 'VERIFIED' ? 'CONFIRMED' : selectedOrder.status });
      }
      fetchOrders();
    } catch (err: any) { setError(err.message); }
  };

  const viewOrder = async (id: string) => {
    try {
      const data = await api.get<ShopOrder>(`/api/admin/shop/orders/${id}`);
      setSelectedOrder(data);
      setEditTracking({
        carrier: data.carrier || '',
        trackingNumber: data.trackingNumber || '',
        shippingCost: data.shippingCost?.toString() || '0',
        notes: data.notes || '',
      });
    } catch (err: any) { setError(err.message); }
  };

  const handleDetailsUpdate = async (orderId: string) => {
    try {
      await api.patch(`/api/admin/shop/orders/${orderId}/details`, {
        shippingCost: Number(editTracking.shippingCost),
        trackingNumber: editTracking.trackingNumber,
        carrier: editTracking.carrier,
        notes: editTracking.notes,
      });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          carrier: editTracking.carrier,
          trackingNumber: editTracking.trackingNumber,
          shippingCost: Number(editTracking.shippingCost),
          notes: editTracking.notes,
        });
      }
      fetchOrders();
    } catch (err: any) { setError(err.message); }
  };

  const paginated = orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-serif text-aura-ivory">Shop Orders</h1>

      {error && <div className="bg-red-900/20 text-red-300 rounded-lg p-3 text-sm">{error}</div>}

      {/* Filters */}
      <div className="flex flex-row gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 bg-aura-ink border border-aura-umber rounded-lg text-sm text-aura-cream focus:outline-none focus:border-aura-clay"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-2 bg-aura-ink border border-aura-umber rounded-lg text-sm text-aura-cream focus:outline-none focus:border-aura-clay shrink-0"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <button onClick={fetchOrders} className="px-3 py-2 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream text-sm hover:border-aura-sand shrink-0">Refresh</button>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aura-umber"></div></div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-10 text-aura-sand">No orders found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto bg-aura-ink rounded-lg border border-aura-umber">
            <table className="min-w-full divide-y divide-aura-umber/50">
              <thead className="bg-aura-umber/30">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-aura-sand uppercase tracking-wider">Order #</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-aura-sand uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-aura-sand uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-aura-sand uppercase tracking-wider">Items</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-aura-sand uppercase tracking-wider">Payment</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-aura-sand uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-aura-sand uppercase tracking-wider">Total</th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-aura-sand uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-umber/30">
                {paginated.map((order) => (
                  <tr key={order.id} className="hover:bg-aura-bark/30">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <p className="text-sm font-bold text-aura-cream">{order.orderNumber}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status] || ''}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <p className="text-sm text-aura-cream">{order.user?.name || 'Guest'}</p>
                      <p className="text-xs text-aura-sand">{order.user?.email || '—'}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-aura-sand">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-aura-sand">{order.items?.length || 0}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[order.paymentStatus] || ''}`}>{order.paymentStatus}</span>
                      <p className="text-[10px] text-aura-sand mt-0.5">{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '—'}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="text-xs px-1.5 py-0.5 bg-aura-bark border border-aura-umber rounded text-aura-cream"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-bold text-aura-cream">{formatETB(order.total)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'CASH_ON_DELIVERY' && (
                          <>
                            <button onClick={() => handlePaymentVerify(order.id, 'VERIFIED')} title="Verify Payment" className="icon-btn bg-green-900/30 text-green-300 hover:bg-green-900/50">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handlePaymentVerify(order.id, 'REJECTED')} title="Reject Payment" className="icon-btn bg-red-900/30 text-red-300 hover:bg-red-900/50">
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => viewOrder(order.id)} title="View" className="icon-btn text-aura-clay hover:text-aura-sand">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile compact cards */}
          <div className="md:hidden space-y-1.5">
            {paginated.map((order) => (
              <div key={order.id} className="bg-aura-ink rounded-lg border border-aura-umber p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <p className="text-sm font-bold text-aura-cream shrink-0">{order.orderNumber}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${ORDER_STATUS_COLORS[order.status] || ''}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</span>
                  </div>
                  <p className="text-sm font-bold text-aura-cream shrink-0">{formatETB(order.total)}</p>
                </div>
                <p className="text-xs text-aura-sand mt-1 truncate">
                  {order.user?.name || 'Guest'} · {new Date(order.createdAt).toLocaleDateString()} · {order.items?.length || 0} item(s)
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button onClick={() => viewOrder(order.id)} className="text-aura-clay hover:text-aura-sand" title="View">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'CASH_ON_DELIVERY' && (
                    <>
                      <button onClick={() => handlePaymentVerify(order.id, 'VERIFIED')} className="text-[10px] px-2 py-0.5 rounded bg-green-900/30 text-green-300 hover:bg-green-900/50">Verify</button>
                      <button onClick={() => handlePaymentVerify(order.id, 'REJECTED')} className="text-[10px] px-2 py-0.5 rounded bg-red-900/30 text-red-300 hover:bg-red-900/50">Reject</button>
                    </>
                  )}
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className="text-[10px] px-1.5 py-0.5 bg-aura-bark border border-aura-umber rounded text-aura-cream ml-auto"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-aura-ink border border-aura-umber rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-serif text-aura-ivory">{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-aura-sand hover:text-aura-cream"><XMarkIcon className="w-5 h-5" /></button>
            </div>

            {/* Customer info */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-aura-bark rounded-lg p-3">
                <p className="text-xs text-aura-sand mb-1">Customer</p>
                <p className="text-sm text-aura-cream">{selectedOrder.user?.name || 'Guest'}</p>
                <p className="text-xs text-aura-sand">{selectedOrder.user?.email}</p>
                <p className="text-xs text-aura-sand">{selectedOrder.user?.phone}</p>
              </div>
              <div className="bg-aura-bark rounded-lg p-3">
                <p className="text-xs text-aura-sand mb-1">Shipping Address</p>
                <p className="text-sm text-aura-cream">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-xs text-aura-sand">{selectedOrder.shippingAddress?.phone}</p>
                <p className="text-xs text-aura-sand">{selectedOrder.shippingAddress?.address}</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-semibold text-aura-cream">Items</h3>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm bg-aura-bark rounded p-2">
                  <div className="flex gap-2">
                    {item.product?.images?.[0] && <img src={item.product.images[0].url} alt="" className="w-10 h-10 rounded object-cover" />}
                    <div>
                      <p className="text-aura-cream">{item.name} × {item.quantity}</p>
                      {item.variantLabel && <p className="text-xs text-aura-sand">{item.variantLabel}</p>}
                    </div>
                  </div>
                  <span className="text-aura-cream">{formatETB(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-aura-umber pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-aura-sand">Subtotal</span><span className="text-aura-cream">{formatETB(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-aura-sand">Shipping</span><span className="text-aura-cream">{selectedOrder.shippingCost === 0 ? 'Free' : formatETB(selectedOrder.shippingCost)}</span></div>
              <div className="flex justify-between font-bold"><span className="text-aura-cream">Total</span><span className="text-aura-cream">{formatETB(selectedOrder.total)}</span></div>
            </div>

            {/* Tracking & shipping editor */}
            <div className="mt-4 border-t border-aura-umber pt-3">
              <h3 className="text-sm font-semibold text-aura-cream mb-2">Tracking & Shipping</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-aura-sand mb-1 block">Carrier</label>
                  <input
                    type="text"
                    value={editTracking.carrier}
                    onChange={(e) => setEditTracking({ ...editTracking, carrier: e.target.value })}
                    placeholder="e.g. Ethiopian Postal, DHL"
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm focus:outline-none focus:border-aura-clay"
                  />
                </div>
                <div>
                  <label className="text-xs text-aura-sand mb-1 block">Tracking Number</label>
                  <input
                    type="text"
                    value={editTracking.trackingNumber}
                    onChange={(e) => setEditTracking({ ...editTracking, trackingNumber: e.target.value })}
                    placeholder="Tracking number"
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm focus:outline-none focus:border-aura-clay"
                  />
                </div>
                <div>
                  <label className="text-xs text-aura-sand mb-1 block">Shipping Cost (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    value={editTracking.shippingCost}
                    onChange={(e) => setEditTracking({ ...editTracking, shippingCost: e.target.value })}
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm focus:outline-none focus:border-aura-clay"
                  />
                </div>
                <div>
                  <label className="text-xs text-aura-sand mb-1 block">Admin Notes</label>
                  <input
                    type="text"
                    value={editTracking.notes}
                    onChange={(e) => setEditTracking({ ...editTracking, notes: e.target.value })}
                    placeholder="Internal notes"
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm focus:outline-none focus:border-aura-clay"
                  />
                </div>
              </div>
              <button
                onClick={() => handleDetailsUpdate(selectedOrder.id)}
                className="mt-2 px-4 py-2 rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
              >
                Save Details
              </button>
            </div>

            {/* Payment receipt */}
            {selectedOrder.paymentReceiptUrl && (
              <div className="mt-4 border-t border-aura-umber pt-3">
                <h3 className="text-sm font-semibold text-aura-cream mb-2">Payment Receipt</h3>
                <a href={selectedOrder.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-aura-clay hover:text-aura-sand">View receipt →</a>
              </div>
            )}

            {/* Status history */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="mt-4 border-t border-aura-umber pt-3">
                <h3 className="text-sm font-semibold text-aura-cream mb-2">Status History</h3>
                <div className="space-y-1">
                  {selectedOrder.statusHistory.map((h) => (
                    <div key={h.id} className="text-xs flex justify-between">
                      <span className="text-aura-cream">{ORDER_STATUS_LABELS[h.status] || h.status} {h.note && `— ${h.note}`}</span>
                      <span className="text-aura-sand">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-aura-umber">
              {selectedOrder.paymentStatus === 'PENDING' && selectedOrder.paymentMethod !== 'CASH_ON_DELIVERY' && (
                <>
                  <button onClick={() => handlePaymentVerify(selectedOrder.id, 'VERIFIED')} className="flex-1 px-4 py-2 rounded bg-green-900/30 text-green-300 text-sm hover:bg-green-900/50">Verify Payment</button>
                  <button onClick={() => handlePaymentVerify(selectedOrder.id, 'REJECTED')} className="flex-1 px-4 py-2 rounded bg-red-900/30 text-red-300 text-sm hover:bg-red-900/50">Reject</button>
                </>
              )}
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                className="px-3 py-2 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOrderManagement;
