import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ShopOrder, formatETB, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../Shop/shopTypes';
import StatusBadge from '../Shop/StatusBadge';
import { XMarkIcon, EyeIcon, CheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ShopOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editTracking, setEditTracking] = useState({ carrier: '', trackingNumber: '', shippingCost: '', notes: '' });
  const ITEMS_PER_PAGE = 10;

  useEffect(() => { fetchOrders(); }, [statusFilter, currentPage]);

  // Debounced search auto-fetch (resets to page 1)
  useEffect(() => {
    const t = setTimeout(() => { if (currentPage !== 1) setCurrentPage(1); else fetchOrders(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('page', String(currentPage));
      params.set('limit', String(ITEMS_PER_PAGE));
      const data = await api.get<{ orders: ShopOrder[]; pagination: { total: number; pages: number } }>(`/api/admin/shop/orders?${params.toString()}`);
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.pages || 1);
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

  const paginated = orders;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-serif text-content-emphasis">Shop Orders</h1>

      {error && <div className="bg-danger-bg text-danger rounded-lg p-3 text-sm">{error}</div>}

      {/* Filters */}
      <div className="flex flex-row gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 bg-surface border border-edge rounded-lg text-sm text-content focus:outline-none focus:border-edge-focus"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-2 bg-surface border border-edge rounded-lg text-sm text-content focus:outline-none focus:border-edge-focus shrink-0"
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
        <button onClick={fetchOrders} className="px-3 py-2 bg-surface border border-edge rounded-lg text-content text-sm hover:border-edge-strong shrink-0">Refresh</button>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edge"></div></div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-10 text-content-secondary">No orders found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto bg-surface rounded-lg border border-edge">
            <table className="min-w-full divide-y divide-edge-subtle">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-content-secondary uppercase tracking-wider">Order #</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-content-secondary uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-content-secondary uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-content-secondary uppercase tracking-wider">Items</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-content-secondary uppercase tracking-wider">Payment</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-content-secondary uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-content-secondary uppercase tracking-wider">Total</th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-content-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle">
                {paginated.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--state-hover)]">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <p className="text-sm font-bold text-content">{order.orderNumber}</p>
                      <StatusBadge status={order.status} kind="order" className="text-[10px] px-1.5 py-0.5" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <p className="text-sm text-content">{order.user?.name || 'Guest'}</p>
                      <p className="text-xs text-content-secondary">{order.user?.email || '—'}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-content-secondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-content-secondary">{order.items?.length || 0}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <StatusBadge status={order.paymentStatus} kind="payment" srPrefix="Payment" className="text-[10px] px-1.5 py-0.5" />
                      <p className="text-[10px] text-content-secondary mt-0.5">{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '—'}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="text-xs px-1.5 py-0.5 bg-canvas border border-edge rounded text-content"
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
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-bold text-content">{formatETB(order.total)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'CASH_ON_DELIVERY' && (
                          <>
                            <button onClick={() => handlePaymentVerify(order.id, 'VERIFIED')} title="Verify Payment" className="icon-btn bg-success-bg text-success hover:bg-success-bg">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handlePaymentVerify(order.id, 'REJECTED')} title="Reject Payment" className="icon-btn bg-danger-bg text-danger hover:bg-danger-bg">
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => viewOrder(order.id)} title="View" className="icon-btn text-accent-400 hover:text-content-secondary">
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
              <div key={order.id} className="bg-surface rounded-lg border border-edge p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <p className="text-sm font-bold text-content shrink-0">{order.orderNumber}</p>
                    <StatusBadge status={order.status} kind="order" className="text-[10px] px-1.5 py-0.5" />
                  </div>
                  <p className="text-sm font-bold text-content shrink-0">{formatETB(order.total)}</p>
                </div>
                <p className="text-xs text-content-secondary mt-1 truncate">
                  {order.user?.name || 'Guest'} · {new Date(order.createdAt).toLocaleDateString()} · {order.items?.length || 0} item(s)
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button onClick={() => viewOrder(order.id)} className="text-accent-400 hover:text-content-secondary" title="View">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'CASH_ON_DELIVERY' && (
                    <>
                      <button onClick={() => handlePaymentVerify(order.id, 'VERIFIED')} className="text-[10px] px-2 py-0.5 rounded bg-success-bg text-success hover:bg-success-bg">Verify</button>
                      <button onClick={() => handlePaymentVerify(order.id, 'REJECTED')} className="text-[10px] px-2 py-0.5 rounded bg-danger-bg text-danger hover:bg-danger-bg">Reject</button>
                    </>
                  )}
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className="text-[10px] px-1.5 py-0.5 bg-canvas border border-edge rounded text-content ml-auto"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-surface border border-edge text-sm text-content disabled:opacity-40 hover:border-edge-strong"
          >
            Prev
          </button>
          <span className="text-sm text-content-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 rounded-lg bg-surface border border-edge text-sm text-content disabled:opacity-40 hover:border-edge-strong"
          >
            Next
          </button>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-overlay z-[70] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-surface border border-edge rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-serif text-content-emphasis">{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-content-secondary hover:text-content"><XMarkIcon className="w-5 h-5" /></button>
            </div>

            {/* Customer info */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-xs text-content-secondary mb-1">Customer</p>
                <p className="text-sm text-content">{selectedOrder.user?.name || 'Guest'}</p>
                <p className="text-xs text-content-secondary">{selectedOrder.user?.email}</p>
                <p className="text-xs text-content-secondary">{selectedOrder.user?.phone}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-xs text-content-secondary mb-1">Shipping Address</p>
                <p className="text-sm text-content">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-xs text-content-secondary">{selectedOrder.shippingAddress?.phone}</p>
                <p className="text-xs text-content-secondary">{selectedOrder.shippingAddress?.address}</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-semibold text-content">Items</h3>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm bg-canvas rounded p-2">
                  <div className="flex gap-2">
                    {item.product?.images?.[0] && <img src={item.product.images[0].url} alt="" className="w-10 h-10 rounded object-cover" />}
                    <div>
                      <p className="text-content">{item.name} × {item.quantity}</p>
                      {item.variantLabel && <p className="text-xs text-content-secondary">{item.variantLabel}</p>}
                    </div>
                  </div>
                  <span className="text-content">{formatETB(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-edge pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-content-secondary">Subtotal</span><span className="text-content">{formatETB(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-content-secondary">Shipping</span><span className="text-content">{selectedOrder.shippingCost === 0 ? 'Free' : formatETB(selectedOrder.shippingCost)}</span></div>
              <div className="flex justify-between font-bold"><span className="text-content">Total</span><span className="text-content">{formatETB(selectedOrder.total)}</span></div>
            </div>

            {/* Tracking & shipping editor */}
            <div className="mt-4 border-t border-edge pt-3">
              <h3 className="text-sm font-semibold text-content mb-2">Tracking & Shipping</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-content-secondary mb-1 block">Carrier</label>
                  <input
                    type="text"
                    value={editTracking.carrier}
                    onChange={(e) => setEditTracking({ ...editTracking, carrier: e.target.value })}
                    placeholder="e.g. Ethiopian Postal, DHL"
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded text-content text-sm focus:outline-none focus:border-edge-focus"
                  />
                </div>
                <div>
                  <label className="text-xs text-content-secondary mb-1 block">Tracking Number</label>
                  <input
                    type="text"
                    value={editTracking.trackingNumber}
                    onChange={(e) => setEditTracking({ ...editTracking, trackingNumber: e.target.value })}
                    placeholder="Tracking number"
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded text-content text-sm focus:outline-none focus:border-edge-focus"
                  />
                </div>
                <div>
                  <label className="text-xs text-content-secondary mb-1 block">Shipping Cost (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    value={editTracking.shippingCost}
                    onChange={(e) => setEditTracking({ ...editTracking, shippingCost: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded text-content text-sm focus:outline-none focus:border-edge-focus"
                  />
                </div>
                <div>
                  <label className="text-xs text-content-secondary mb-1 block">Admin Notes</label>
                  <input
                    type="text"
                    value={editTracking.notes}
                    onChange={(e) => setEditTracking({ ...editTracking, notes: e.target.value })}
                    placeholder="Internal notes"
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded text-content text-sm focus:outline-none focus:border-edge-focus"
                  />
                </div>
              </div>
              <button
                onClick={() => handleDetailsUpdate(selectedOrder.id)}
                className="mt-2 px-4 py-2 rounded bg-accent-600 text-content-on-accent text-sm hover:bg-accent-700"
              >
                Save Details
              </button>
            </div>

            {/* Payment receipt */}
            {selectedOrder.paymentReceiptUrl && (
              <div className="mt-4 border-t border-edge pt-3">
                <h3 className="text-sm font-semibold text-content mb-2">Payment Receipt</h3>
                <a href={selectedOrder.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-400 hover:text-content-secondary">View receipt →</a>
              </div>
            )}

            {/* Status history */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="mt-4 border-t border-edge pt-3">
                <h3 className="text-sm font-semibold text-content mb-2">Status History</h3>
                <div className="space-y-1">
                  {selectedOrder.statusHistory.map((h) => (
                    <div key={h.id} className="text-xs flex justify-between">
                      <span className="text-content">{ORDER_STATUS_LABELS[h.status] || h.status} {h.note && `— ${h.note}`}</span>
                      <span className="text-content-secondary">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-edge">
              {selectedOrder.paymentStatus === 'PENDING' && selectedOrder.paymentMethod !== 'CASH_ON_DELIVERY' && (
                <>
                  <button onClick={() => handlePaymentVerify(selectedOrder.id, 'VERIFIED')} className="flex-1 px-4 py-2 rounded bg-success-bg text-success text-sm hover:bg-success-bg">Verify Payment</button>
                  <button onClick={() => handlePaymentVerify(selectedOrder.id, 'REJECTED')} className="flex-1 px-4 py-2 rounded bg-danger-bg text-danger text-sm hover:bg-danger-bg">Reject</button>
                </>
              )}
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                className="px-3 py-2 bg-canvas border border-edge rounded text-content text-sm"
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
