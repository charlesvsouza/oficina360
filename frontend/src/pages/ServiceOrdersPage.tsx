import { useEffect, useState, useRef } from 'react';
import { serviceOrdersApi, customersApi, vehiclesApi, servicesApi, inventoryApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import {
  ClipboardList,
  Plus,
  Search,
  Car,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Wrench,
  Package,
  FileText,
  DollarSign,
  Calendar,
  Play,
  Trash2,
  Eye,
  Share2,
  AlertCircle,
  Settings,
  ArrowRight,
  ChevronRight,
  Printer,
  History,
  Info,
  Send,
  Save,
  Key,
  Maximize2,
  Minimize2,
  Layout,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  ABERTA: { label: 'Aberta', color: 'bg-slate-100 text-slate-700', icon: Plus },
  EM_DIAGNOSTICO: { label: 'Em Diagnóstico', color: 'bg-indigo-100 text-indigo-700', icon: Search },
  ORCAMENTO_PRONTO: { label: 'Orçamento Pronto', color: 'bg-blue-100 text-blue-700', icon: FileText },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', color: 'bg-orange-100 text-orange-700', icon: Clock },
  APROVADO: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REPROVADO: { label: 'Reprovado', color: 'bg-red-100 text-red-700', icon: XCircle },
  AGUARDANDO_PECAS: { label: 'Aguardando Peças', color: 'bg-amber-100 text-amber-700', icon: Package },
  EM_EXECUCAO: { label: 'Em Execução', color: 'bg-cyan-100 text-cyan-700', icon: Play },
  PRONTO_ENTREGA: { label: 'Pronto p/ Entrega', color: 'bg-violet-100 text-violet-700', icon: CheckCircle },
  FATURADO: { label: 'Faturado', color: 'bg-green-100 text-green-700', icon: DollarSign },
  ENTREGUE: { label: 'Entregue', color: 'bg-slate-900 text-white', icon: CheckCircle },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const A4_STYLE = `
  .a4-document {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    margin: 0 auto;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: "Inter", "Segoe UI", sans-serif;
    color: #1e293b;
    line-height: 1.5;
  }
  .a4-document p {
    text-align: justify;
    font-size: 11px;
    margin-bottom: 8px;
  }
  .a4-document h1, .a4-document h2, .a4-document h3 {
    text-align: left;
    border-bottom: 2px solid #000;
    padding-bottom: 4px;
    margin-bottom: 16px;
    text-transform: uppercase;
    font-weight: 900;
    font-size: 14px;
  }
  .a4-document table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  .a4-document th, .a4-document td {
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    font-size: 10px;
  }
  .a4-document th {
    background: #f1f5f9;
    font-weight: 800;
    text-transform: uppercase;
  }
`;

export function ServiceOrdersPage() {
  const { tenant } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isA4Mode, setIsA4Mode] = useState(false);

  // Formulário Nova OS
  const [newOrderData, setNewOrderData] = useState({
    customerId: '',
    vehicleId: '',
    complaint: '',
    kmEntrada: 0,
  });

  // Estado de Edição
  const [detailEdit, setDetailEdit] = useState({
    complaint: '',
    diagnosis: '',
    technicalReport: '',
    observations: '',
    notes: '',
  });

  // Catálogo de Itens
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogItems, setCatalogItems] = useState<{ services: any[], parts: any[] }>({ services: [], parts: [] });
  const [catalogSearch, setCatalogSearch] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadOrders();
    loadBasics();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const response = await serviceOrdersApi.getAll(statusFilter || undefined);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Falha ao carregar ordens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBasics = async () => {
    try {
      const [cRes, vRes] = await Promise.all([
        customersApi.getAll(),
        vehiclesApi.getAll(),
      ]);
      setCustomers(cRes.data);
      setVehicles(vRes.data);
    } catch (error) {
      console.error('Falha ao carregar dados básicos:', error);
    }
  };

  const handleSelectOrder = async (order: any) => {
    try {
      const res = await serviceOrdersApi.getById(order.id);
      const fullOrder = res.data;
      setSelectedOrder(fullOrder);
      setDetailEdit({
        complaint: fullOrder.complaint || '',
        diagnosis: fullOrder.diagnosis || '',
        technicalReport: fullOrder.technicalReport || '',
        observations: fullOrder.observations || '',
        notes: fullOrder.notes || '',
      });
    } catch (error) {
      console.error('Falha ao carregar detalhes da ordem:', error);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedOrder) return;
    try {
      await serviceOrdersApi.update(selectedOrder.id, detailEdit);
      const res = await serviceOrdersApi.getById(selectedOrder.id);
      setSelectedOrder(res.data);
      loadOrders();
      alert('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Falha ao salvar detalhes:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      await serviceOrdersApi.updateStatus(selectedOrder.id, { status: newStatus });
      const res = await serviceOrdersApi.getById(selectedOrder.id);
      setSelectedOrder(res.data);
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const handleAddItem = async (itemData: any) => {
    if (!selectedOrder) return;
    try {
      await serviceOrdersApi.addItem(selectedOrder.id, itemData);
      const res = await serviceOrdersApi.getById(selectedOrder.id);
      setSelectedOrder(res.data);
      loadOrders();
      setShowCatalog(false);
      setCatalogSearch('');
    } catch (error) {
      console.error('Falha ao adicionar item:', error);
    }
  };

  const handleUpdateItem = async (itemId: string, updatedData: any) => {
    if (!selectedOrder) return;
    try {
      await serviceOrdersApi.updateItem(selectedOrder.id, itemId, updatedData);
      const res = await serviceOrdersApi.getById(selectedOrder.id);
      setSelectedOrder(res.data);
      loadOrders();
    } catch (error) {
      console.error('Falha ao atualizar item:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedOrder || !confirm('Deseja realmente remover este item? O estoque será estornado.')) return;
    try {
      await serviceOrdersApi.removeItem(selectedOrder.id, itemId);
      const res = await serviceOrdersApi.getById(selectedOrder.id);
      setSelectedOrder(res.data);
      loadOrders();
    } catch (error) {
      console.error('Falha ao remover item:', error);
    }
  };

  const loadCatalog = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        servicesApi.getAll(),
        inventoryApi.getAllParts()
      ]);
      setCatalogItems({
        services: Array.isArray(sRes.data) ? sRes.data : [],
        parts: Array.isArray(pRes.data) ? pRes.data : []
      });
      setShowCatalog(true);
    } catch (error) {
      console.error('Falha ao carregar catálogo:', error);
    }
  };

  const filteredOrders = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.vehicle?.plate?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
      <style>{A4_STYLE}</style>
      
      {/* LISTA DE OS */}
      <div className="w-80 flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase text-xs">
              <ClipboardList size={16} /> Ordens de Serviço
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar por placa ou cliente..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:ring-4 focus:ring-slate-900/5 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.ABERTA;
            const isActive = selectedOrder?.id === order.id;
            return (
              <div 
                key={order.id} 
                onClick={() => handleSelectOrder(order)}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:bg-slate-50 relative",
                  isActive ? "bg-primary-50/30 border-l-4 border-l-primary-600" : ""
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono font-black text-slate-400">#{order.id.slice(0, 8)}</span>
                  <div className={cn("w-2 h-2 rounded-full", status.color.split(' ')[0])} />
                </div>
                <p className="font-bold text-slate-900 text-sm truncate leading-none mb-1">{order.customer?.name}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-2">{order.vehicle?.plate} • {order.vehicle?.model}</p>
                <div className="flex justify-between items-center">
                   <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", status.color)}>
                    {status.label}
                  </span>
                  <span className="text-xs font-black text-slate-900">R$ {Number(order.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })}
          {filteredOrders.length === 0 && !loading && (
             <div className="p-10 text-center text-slate-400">
               <p className="text-xs font-bold uppercase tracking-widest">Nenhuma OS encontrada</p>
             </div>
          )}
        </div>
      </div>

      {/* VISUALIZAÇÃO PRINCIPAL */}
      <div className={cn(
        "flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm transition-all duration-500",
        isA4Mode ? "max-w-[210mm] mx-auto shadow-2xl ring-1 ring-slate-200" : ""
      )}>
        {!selectedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50">
            <Layout size={64} className="mb-4 stroke-[1px]" />
            <p className="font-bold uppercase tracking-widest text-xs">Selecione uma Ordem de Serviço</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestão Profissional</span>
                    <span className={cn("badge text-[9px] px-2 py-0.5 rounded-md", statusConfig[selectedOrder.status]?.color)}>
                      {statusConfig[selectedOrder.status]?.label}
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">OS {selectedOrder.id.slice(0, 8)}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsA4Mode(!isA4Mode)} className={cn(
                  "btn h-10 px-4 rounded-xl text-xs font-bold gap-2",
                  isA4Mode ? "bg-slate-900 text-white" : "bg-white border border-slate-200"
                )}>
                  {isA4Mode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {isA4Mode ? 'Modo Tela' : 'Modo Impressão (A4)'}
                </button>
                <button onClick={() => window.print()} className="btn btn-secondary h-10 px-4 rounded-xl text-xs font-bold gap-2"><Printer size={16} /> Imprimir</button>
                <button onClick={handleSaveDetails} className="btn btn-primary h-10 px-6 rounded-xl text-xs font-bold gap-2"><Save size={16} /> Salvar Alterações</button>
              </div>
            </div>

            <div className={cn(
              "flex-1 overflow-y-auto p-8 space-y-8",
              isA4Mode ? "bg-slate-100/50 py-12" : ""
            )}>
              <div className={isA4Mode ? "a4-document" : "space-y-8"}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User size={14} className="text-slate-900" /> Dados do Cliente
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Nome / Razão Social</p>
                        <p className="font-black text-slate-900">{selectedOrder.customer?.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Telefone</p>
                        <p className="font-bold text-slate-700">{selectedOrder.customer?.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Documento</p>
                        <p className="font-bold text-slate-700">{selectedOrder.customer?.document || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
                    <h3 className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Car size={14} /> Dados do Veículo
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Veículo</p>
                        <p className="font-black text-white text-lg">{selectedOrder.vehicle?.brand} {selectedOrder.vehicle?.model}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Placa</p>
                        <p className="font-mono font-black text-primary-400">{selectedOrder.vehicle?.plate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reclamação Inicial</label>
                    <textarea 
                      value={detailEdit.complaint} 
                      onChange={(e) => setDetailEdit({...detailEdit, complaint: e.target.value})}
                      className="w-full h-24 bg-slate-50 border-slate-200 rounded-xl p-3 text-xs font-bold focus:bg-white transition-all focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diagnóstico Técnico</label>
                    <textarea 
                      value={detailEdit.diagnosis} 
                      onChange={(e) => setDetailEdit({...detailEdit, diagnosis: e.target.value})}
                      className="w-full h-24 bg-slate-50 border-slate-200 rounded-xl p-3 text-xs font-bold focus:bg-white transition-all focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Laudo / Solução</label>
                    <textarea 
                      value={detailEdit.technicalReport} 
                      onChange={(e) => setDetailEdit({...detailEdit, technicalReport: e.target.value})}
                      className="w-full h-24 bg-slate-50 border-slate-200 rounded-xl p-3 text-xs font-bold focus:bg-white transition-all focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Serviços */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Wrench size={14} className="text-slate-900" /> Serviços Realizados
                      </h3>
                      <button onClick={loadCatalog} className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">+ Adicionar Serviço</button>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="px-5 py-3 border-b border-slate-100">Descrição</th>
                          <th className="px-5 py-3 border-b border-slate-100 w-24">Qtd/Hrs</th>
                          <th className="px-5 py-3 border-b border-slate-100 w-32">Unitário</th>
                          <th className="px-5 py-3 border-b border-slate-100 w-32 text-right">Subtotal</th>
                          <th className="px-5 py-3 border-b border-slate-100 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {selectedOrder.items?.filter((i: any) => i.type === 'service').map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-900">{item.description}</td>
                            <td className="px-6 py-3">
                              <input 
                                type="number" 
                                className="w-16 bg-slate-50 border border-transparent hover:border-slate-200 rounded-md px-2 py-1 text-center font-bold" 
                                defaultValue={item.quantity}
                                onBlur={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                              />
                            </td>
                            <td className="px-5 py-3">R$ {Number(item.unitPrice).toLocaleString('pt-BR')}</td>
                            <td className="px-5 py-3 font-black text-slate-900 text-right">R$ {Number(item.totalPrice).toLocaleString('pt-BR')}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Peças */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Package size={14} className="text-slate-900" /> Peças e Materiais
                      </h3>
                      <button onClick={loadCatalog} className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">+ Lançar Peça</button>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="px-5 py-3 border-b border-slate-100">Descrição</th>
                          <th className="px-5 py-3 border-b border-slate-100 w-24 text-center">Qtd</th>
                          <th className="px-5 py-3 border-b border-slate-100 w-32">Unitário</th>
                          <th className="px-5 py-3 border-b border-slate-100 w-32 text-right">Subtotal</th>
                          <th className="px-5 py-3 border-b border-slate-100 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {selectedOrder.items?.filter((i: any) => i.type === 'part').map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-900">{item.description}</td>
                            <td className="px-5 py-3">
                              <input 
                                type="number" 
                                className="w-16 bg-slate-50 border border-transparent hover:border-slate-200 rounded-md px-2 py-1 text-center font-bold" 
                                defaultValue={item.quantity}
                                onBlur={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                              />
                            </td>
                            <td className="px-5 py-3">R$ {Number(item.unitPrice).toLocaleString('pt-BR')}</td>
                            <td className="px-5 py-3 font-black text-slate-900 text-right">R$ {Number(item.totalPrice).toLocaleString('pt-BR')}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações do Fluxo</h4>
                    <div className="flex flex-wrap gap-2">
                       <button onClick={() => handleStatusChange('EM_DIAGNOSTICO')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Em Diagnóstico</button>
                       <button onClick={() => handleStatusChange('ORCAMENTO_PRONTO')} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Orçamento Pronto</button>
                       <button onClick={() => handleStatusChange('APROVADO')} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Aprovado</button>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-6 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                      <span>Serviços: R$ {Number(selectedOrder.totalServices || 0).toLocaleString('pt-BR')}</span>
                      <span>Peças: R$ {Number(selectedOrder.totalParts || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Total da Ordem</p>
                        <p className="text-4xl font-black tracking-tight">R$ {Number(selectedOrder.totalCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL CATÁLOGO */}
      <AnimatePresence>
        {showCatalog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCatalog(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Catálogo de Itens</h3>
                <button onClick={() => setShowCatalog(false)} className="text-slate-400 hover:text-red-500"><XCircle size={24} /></button>
              </div>
              <div className="p-6 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Pesquise por serviço ou peça..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 text-sm font-bold focus:bg-white" value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviços</h4>
                    <div className="space-y-2">
                       {catalogItems.services.filter(s => s.name.toLowerCase().includes(catalogSearch.toLowerCase())).map(s => (
                         <button key={s.id} onClick={() => handleAddItem({ type: 'service', serviceId: s.id, description: s.name, quantity: 1, unitPrice: s.basePrice || s.hourlyRate })} className="w-full p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-900 text-left transition-all group flex items-center justify-between">
                           <div>
                             <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">R$ {Number(s.basePrice || s.hourlyRate).toLocaleString('pt-BR')}</p>
                           </div>
                           <Plus size={16} className="text-slate-300 group-hover:text-slate-900" />
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peças</h4>
                    <div className="space-y-2">
                       {catalogItems.parts.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase())).map(p => (
                         <button key={p.id} onClick={() => handleAddItem({ type: 'part', partId: p.id, description: p.name, quantity: 1, unitPrice: p.unitPrice })} className="w-full p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-900 text-left transition-all group flex items-center justify-between">
                           <div>
                             <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Estoque: {p.currentStock || 0} | R$ {Number(p.unitPrice).toLocaleString('pt-BR')}</p>
                           </div>
                           <Plus size={16} className="text-slate-300 group-hover:text-slate-900" />
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL NOVA OS */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10">
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nova OS</h2>
                 <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
               </div>
               <form className="space-y-5" onSubmit={async (e) => {
                 e.preventDefault();
                 try {
                   const res = await serviceOrdersApi.create(newOrderData);
                   setShowCreateModal(false);
                   loadOrders();
                   handleSelectOrder(res.data);
                 } catch (error) { alert('Erro ao criar OS. Verifique os dados.'); }
               }}>
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cliente *</label>
                   <select className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:ring-4 focus:ring-slate-900/5 transition-all" value={newOrderData.customerId} onChange={(e) => setNewOrderData({...newOrderData, customerId: e.target.value})} required>
                     <option value="">Selecione um cliente...</option>
                     {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Veículo *</label>
                   <select className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:ring-4 focus:ring-slate-900/5 transition-all" value={newOrderData.vehicleId} onChange={(e) => setNewOrderData({...newOrderData, vehicleId: e.target.value})} required>
                     <option value="">Selecione um veículo...</option>
                     {vehicles.filter(v => v.customerId === newOrderData.customerId).map(v => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">KM Entrada</label>
                   <input type="number" className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:ring-4 focus:ring-slate-900/5 transition-all" value={newOrderData.kmEntrada} onChange={(e) => setNewOrderData({...newOrderData, kmEntrada: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Reclamação Principal</label>
                   <textarea className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:ring-4 focus:ring-slate-900/5 transition-all h-24 resize-none" value={newOrderData.complaint} onChange={(e) => setNewOrderData({...newOrderData, complaint: e.target.value})} placeholder="O que o cliente relatou?" />
                 </div>
                 <div className="flex gap-3 pt-4">
                   <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
                   <button type="submit" className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-lg active:scale-95 transition-all">Criar Ordem</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}